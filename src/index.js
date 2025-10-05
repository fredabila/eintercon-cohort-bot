import { 
    default as makeWASocket,
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import CohortManager from './cohortManager.js';

// Configure logger
const logger = pino({ level: 'info' });

// Initialize cohort manager
const cohortManager = new CohortManager();

// Helper function to check if user is admin
async function isAdmin(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === userId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Helper function to get user name
function getUserName(msg) {
    return msg.pushName || msg.verifiedBizName || 'Member';
}

// Main connection function
async function connectToWhatsApp() {
    // Initialize cohort manager first
    await cohortManager.initialize();
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false, // We'll use qrcode-terminal instead
        auth: state,
        // Browser info
        browser: ['Cohort Bot', 'Chrome', '1.0.0']
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Display QR code for authentication
        if (qr) {
            console.log('\n🔐 Scan this QR code with WhatsApp:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('❌ Connection closed due to', lastDisconnect?.error, '\nReconnecting:', shouldReconnect);

            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp successfully!');
            console.log('🤖 Bot is now active and listening for messages...\n');
        }
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            // Skip if no message content
            if (!msg.message) continue;

            const isGroup = msg.key.remoteJid.endsWith('@g.us');
            const sender = msg.key.participant || msg.key.remoteJid;
            const messageText = msg.message.conversation || 
                               msg.message.extendedTextMessage?.text || '';
            const userName = getUserName(msg);

            // 🚫 IGNORE ALL PRIVATE/1-1 MESSAGES - Bot only works in groups
            if (!isGroup) {
                console.log(`🚫 Ignored private message from ${userName}`);
                continue;
            }

            // Only process commands
            if (!messageText.startsWith('!')) continue;

            const args = messageText.slice(1).trim().split(/\s+/);
            const command = args[0].toLowerCase();

            console.log(`📩 Command: !${command} from ${userName} (${sender})`);

            try {
                // Public commands
                if (command === 'help') {
                    const helpText = `
╔═══════════════════════════╗
║  🤖 *COHORT BOT COMMANDS*  ║
╚═══════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  👥 *EVERYONE CAN USE*  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

📖 \`!help\`
   └─ Show this help menu

📊 \`!stats\`
   └─ View cohort statistics

🎯 \`!mynumber\`
   └─ See your member number & join date

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  👑 *ADMIN COMMANDS*     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

✍️ \`!setdm <message>\`
   └─ Customize DM welcome message

📢 \`!setgroup <message>\`
   └─ Customize group announcement

👀 \`!viewtemplates\`
   └─ See all current templates

🔄 \`!resettemplates\`
   └─ Reset to default templates

⚙️ \`!settings\`
   └─ View bot configuration

🔔 \`!toggledm\`
   └─ Enable/disable welcome DMs

📣 \`!togglegroup\`
   └─ Enable/disable group announcements

📝 \`!toggleexit\`
   └─ Enable/disable exit surveys

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ✨ *TEMPLATE VARIABLES* ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🏷️ \`{{memberName}}\` - Member's name
🔢 \`{{memberNumber}}\` - Member # (1, 2, 3...)
📱 \`@{{memberId}}\` - Tag/mention member
🏠 \`{{groupName}}\` - Group name
📅 \`{{joinDate}}\` - Join date

━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Tip:* Use @mentions to tag users!
━━━━━━━━━━━━━━━━━━━━━━━━━`;
                    
                    await sock.sendMessage(msg.key.remoteJid, { text: helpText });
                }

                else if (command === 'stats' && isGroup) {
                    const stats = cohortManager.getStats(msg.key.remoteJid);
                    const statsText = `
╔════════════════════════╗
║  📊 *COHORT STATISTICS*  ║
╚════════════════════════╝

👥 *Total Members Joined*
   └─ ${stats.totalMembers}

✅ *Current Active Members*
   └─ ${stats.currentMembers}

👋 *Members Who Left*
   └─ ${stats.membersLeft}

━━━━━━━━━━━━━━━━━━━━━━
📈 Growth Rate: ${stats.currentMembers > 0 ? Math.round((stats.currentMembers/stats.totalMembers)*100) : 0}% retention
━━━━━━━━━━━━━━━━━━━━━━`;
                    
                    await sock.sendMessage(msg.key.remoteJid, { text: statsText });
                }

                else if (command === 'mynumber' && isGroup) {
                    const member = cohortManager.getMember(msg.key.remoteJid, sender);
                    if (member) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `╔═══════════════════╗
║  🎯 *YOUR PROFILE*  ║
╚═══════════════════╝

👤 *Name:* ${member.name}
🔢 *Member Number:* #${member.number}
📅 *Joined:* ${member.joinDate || new Date(member.joinedAt).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━
You're an important part of this cohort! 🌟`
                        });
                    } else {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `❌ *Not Registered*\n\nYou're not in our cohort records yet. This might happen if you joined before the bot was added.`
                        });
                    }
                }

                // Admin-only commands
                else if (isGroup && await isAdmin(sock, msg.key.remoteJid, sender)) {
                    
                    if (command === 'setdm') {
                        const template = messageText.slice(command.length + 2).trim();
                        if (!template) {
                            await sock.sendMessage(msg.key.remoteJid, {
                                text: `❌ Usage: !setdm <your welcome message>\n\nUse {{memberName}}, {{memberNumber}}, {{groupName}} as placeholders`
                            });
                            return;
                        }
                        await cohortManager.updateTemplate(msg.key.remoteJid, 'dmWelcome', template);
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `✅ DM welcome template updated!`
                        });
                    }

                    else if (command === 'setgroup') {
                        const template = messageText.slice(command.length + 2).trim();
                        if (!template) {
                            await sock.sendMessage(msg.key.remoteJid, {
                                text: `❌ Usage: !setgroup <your announcement message>\n\nUse {{memberName}}, {{memberNumber}}, {{groupName}} as placeholders`
                            });
                            return;
                        }
                        await cohortManager.updateTemplate(msg.key.remoteJid, 'groupAnnouncement', template);
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `✅ Group announcement template updated!`
                        });
                    }

                    else if (command === 'viewtemplates') {
                        const cohort = cohortManager.getCohort(msg.key.remoteJid);
                        const templatesText = `
╔══════════════════════════╗
║  📝 *CURRENT TEMPLATES*   ║
╚══════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━┓
┃  📧 *DM WELCOME*       ┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
${cohort.templates.dmWelcome}

┏━━━━━━━━━━━━━━━━━━━━━━┓
┃  📢 *GROUP ANNOUNCEMENT* ┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
${cohort.templates.groupAnnouncement}

┏━━━━━━━━━━━━━━━━━━━━━━┓
┃  👋 *LEAVE MESSAGE*    ┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
${cohort.templates.leaveMessage}

━━━━━━━━━━━━━━━━━━━━━━
💡 Use !setdm or !setgroup to customize
━━━━━━━━━━━━━━━━━━━━━━`;
                        
                        await sock.sendMessage(msg.key.remoteJid, { text: templatesText });
                    }

                    else if (command === 'resettemplates') {
                        await cohortManager.resetTemplates(msg.key.remoteJid);
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `✅ *Templates Reset!*\n\nAll templates have been restored to their beautiful defaults. 🎨`
                        });
                    }

                    else if (command === 'settings') {
                        const cohort = cohortManager.getCohort(msg.key.remoteJid);
                        const settingsText = `
╔══════════════════════╗
║  ⚙️ *BOT SETTINGS*    ║
╚══════════════════════╝

📧 *DM Welcome Messages*
   └─ ${cohort.settings.sendDM ? '✅ Enabled' : '❌ Disabled'}

📢 *Group Announcements*
   └─ ${cohort.settings.sendGroupMessage ? '✅ Enabled' : '❌ Disabled'}

📊 *Track Member Departures*
   └─ ${cohort.settings.trackLeavers ? '✅ Enabled' : '❌ Disabled'}

📝 *Exit Survey (when members leave)*
   └─ ${cohort.settings.sendExitSurvey ? '✅ Enabled' : '❌ Disabled'}

━━━━━━━━━━━━━━━━━━━━━━
Use toggles: !toggledm, !togglegroup, !toggleexit
━━━━━━━━━━━━━━━━━━━━━━`;
                        
                        await sock.sendMessage(msg.key.remoteJid, { text: settingsText });
                    }

                    else if (command === 'toggledm') {
                        const cohort = cohortManager.getCohort(msg.key.remoteJid);
                        cohort.settings.sendDM = !cohort.settings.sendDM;
                        await cohortManager.save();
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `${cohort.settings.sendDM ? '✅ *DM Welcomes Enabled!*\n\nNew members will receive a personalized welcome message. 📧' : '❌ *DM Welcomes Disabled*\n\nNew members will not receive DMs.'}`
                        });
                    }

                    else if (command === 'togglegroup') {
                        const cohort = cohortManager.getCohort(msg.key.remoteJid);
                        cohort.settings.sendGroupMessage = !cohort.settings.sendGroupMessage;
                        await cohortManager.save();
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `${cohort.settings.sendGroupMessage ? '✅ *Group Announcements Enabled!*\n\nNew member joins will be announced in the group. 📢' : '❌ *Group Announcements Disabled*\n\nNo group announcements for new members.'}`
                        });
                    }

                    else if (command === 'toggleexit') {
                        const cohort = cohortManager.getCohort(msg.key.remoteJid);
                        cohort.settings.sendExitSurvey = !cohort.settings.sendExitSurvey;
                        await cohortManager.save();
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `${cohort.settings.sendExitSurvey ? '✅ *Exit Surveys Enabled!*\n\nMembers who leave will receive a feedback request. 📝' : '❌ *Exit Surveys Disabled*\n\nNo surveys will be sent to members who leave.'}`
                        });
                    }
                } else if (command !== 'help' && command !== 'stats' && command !== 'mynumber') {
                    // Command exists but user is not admin
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `❌ This command requires admin privileges.`
                    });
                }

            } catch (error) {
                console.error('Error handling command:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Error executing command. Please try again.`
                });
            }
        }
    });

    // Handle group participant updates (joins, leaves, promotions, etc.)
    sock.ev.on('group-participants.update', async (update) => {
        console.log('👥 Group participant update:', update);
        
        const { id, participants, action } = update;

        try {
            // Get group metadata
            const groupMetadata = await sock.groupMetadata(id);
            const groupName = groupMetadata.subject;
            const cohort = cohortManager.getCohort(id);

            for (const participant of participants) {
                
                // Handle new member joining
                if (action === 'add') {
                    // Get participant info
                    let memberName = 'New Member';
                    try {
                        // Try to get the contact name
                        const contact = await sock.onWhatsApp(participant);
                        if (contact && contact[0]) {
                            memberName = contact[0].notify || participant.split('@')[0];
                        }
                    } catch (error) {
                        memberName = participant.split('@')[0];
                    }

                    // Add member to cohort and get their number
                    const member = await cohortManager.addMember(id, participant, memberName);
                    
                    console.log(`✅ Member #${member.number} joined: ${memberName}`);

                    // Send DM welcome message if enabled
                    if (cohort.settings.sendDM) {
                        try {
                            const dmMessage = cohortManager.getFormattedMessage(id, 'dmWelcome', {
                                memberName: memberName,
                                memberNumber: member.number,
                                memberId: participant.split('@')[0],
                                groupName: groupName,
                                joinDate: member.joinDate
                            });
                            
                            await sock.sendMessage(participant, { text: dmMessage });
                            console.log(`� Sent DM to ${memberName}`);
                        } catch (error) {
                            console.error(`❌ Could not send DM to ${memberName}:`, error.message);
                        }
                    }

                    // Send group announcement if enabled
                    if (cohort.settings.sendGroupMessage) {
                        const groupMessage = cohortManager.getFormattedMessage(id, 'groupAnnouncement', {
                            memberName: memberName,
                            memberNumber: member.number,
                            memberId: participant.split('@')[0],  // Just the phone number for @mention
                            groupName: groupName,
                            joinDate: member.joinDate
                        });
                        
                        await sock.sendMessage(id, { 
                            text: groupMessage,
                            mentions: [participant]  // Enable WhatsApp mentions
                        });
                        console.log(`� Sent group announcement for ${memberName}`);
                    }
                }

                // Handle member leaving
                else if (action === 'remove') {
                    const member = await cohortManager.removeMember(id, participant);
                    
                    if (member) {
                        // Send group leave message if enabled
                        if (cohort.settings.trackLeavers) {
                            const leaveMessage = cohortManager.getFormattedMessage(id, 'leaveMessage', {
                                memberName: member.name,
                                memberNumber: member.number,
                                groupName: groupName,
                                memberId: participant.split('@')[0],  // Just the phone number for @mention
                                joinDate: member.joinDate
                            });
                            
                            // Send leave message with mention
                            await sock.sendMessage(id, { 
                                text: leaveMessage,
                                mentions: [participant]
                            });
                            console.log(`👋 Member #${member.number} left: ${member.name}`);
                        }

                        // Send exit survey DM if enabled
                        if (cohort.settings.sendExitSurvey) {
                            try {
                                const exitSurveyMessage = cohortManager.getFormattedMessage(id, 'exitSurvey', {
                                    memberName: member.name,
                                    memberNumber: member.number,
                                    groupName: groupName,
                                    memberId: participant,
                                    joinDate: member.joinDate
                                });
                                
                                await sock.sendMessage(participant, { text: exitSurveyMessage });
                                console.log(`📧 Sent exit survey to ${member.name}`);
                            } catch (error) {
                                console.error(`❌ Could not send exit survey to ${member.name}:`, error.message);
                            }
                        }
                    }
                }

                // Handle admin promotions/demotions (optional logging)
                else if (action === 'promote') {
                    console.log(`👑 ${participant} promoted to admin`);
                }
                else if (action === 'demote') {
                    console.log(`👤 ${participant} demoted from admin`);
                }
            }
        } catch (error) {
            console.error('❌ Error handling group participant update:', error);
        }
    });

    return sock;
}

// Start the bot
console.log('🚀 Starting WhatsApp Cohort Bot...\n');
connectToWhatsApp();
