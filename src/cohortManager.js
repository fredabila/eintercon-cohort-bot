import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = 'cohort_data';
const COHORT_FILE = path.join(DATA_DIR, 'cohorts.json');

// Default templates - Eintercon Branded
const DEFAULT_TEMPLATES = {
    dmWelcome: `✨ *Welcome to Eintercon, {{memberName}}!* ✨

You've just joined Cohort #{{memberNumber}} - your gateway to meaningful global connections! 🌍

━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *What is Eintercon?*
━━━━━━━━━━━━━━━━━━━━━━━━━

Eintercon is a platform that helps you create *time-limited global connections* to discover potential long-lasting friendships and relationships. 

This cohort group is your *waiting room* as we build up the community. Once we have enough members, the cohort will officially launch and you'll start making connections on the Eintercon app!

━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *What You Need to Do:*
━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ *Download the Eintercon app*
2️⃣ *Sign up and complete your profile*
3️⃣ *Finish the onboarding process*
4️⃣ *Wait for the cohort to launch!*

📱 *Download Eintercon Now:*
• Android: https://play.google.com/store/apps/details?id=com.eintercon.app
• iOS: https://apps.apple.com/ee/app/eintercon/id6749785496
• Website: https://eintercon.com

━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ *What Happens Next?*
━━━━━━━━━━━━━━━━━━━━━━━━━

The group is currently *locked* as we gather members. Once we reach capacity, the cohort will launch and you'll all connect simultaneously on the app, maximizing your chances of finding amazing connections!

Just sit tight, get the app ready, and we'll notify you when it's time to start! 

Welcome aboard! 💙

- The Eintercon Team`,
    
    groupAnnouncement: `╔══════════════════════════╗
║  🎊 *WELCOME TO EINTERCON!* 🎊  ║
╚══════════════════════════╝

Everyone, let's warmly welcome @{{memberId}}! 🌍✨

🎯 *Cohort Member:* #{{memberNumber}}
📅 *Joined:* {{joinDate}}

━━━━━━━━━━━━━━━━━━━━━━━━━
{{memberName}}, you're now in the waiting room for our cohort launch! 

Make sure to download the Eintercon app and complete your profile. We'll notify everyone when it's time to connect! 

⏳ *Cohort launches when we reach capacity!*
━━━━━━━━━━━━━━━━━━━━━━━━━`,
    
    leaveMessage: `👋 *Farewell, {{memberName}}!*

Member #{{memberNumber}} (@{{memberId}}) has left our cohort.

━━━━━━━━━━━━━━━━━━━━━━━━━
We're sad to see you go! 💙
━━━━━━━━━━━━━━━━━━━━━━━━━`,

    exitSurvey: `Hi {{memberName}},

We noticed you left the {{groupName}} cohort. We're sorry to see you go! 😢

━━━━━━━━━━━━━━━━━━━━━━━━━
📝 *Help Us Improve*
━━━━━━━━━━━━━━━━━━━━━━━━━

Your feedback is invaluable! Could you share why you left?

• Was the group too active/quiet?
• Not the right fit for you?
• Technical issues?
• Found what you were looking for?
• Other reasons?

Just reply to this message - we read every response and use your feedback to improve the Eintercon experience.

━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 *Still Interested in Global Connections?*

Even if the cohort wasn't right, you can still:
• Try Eintercon directly: https://eintercon.com
• Download our app and explore 1-on-1 connections
• Join a different cohort later

Thank you for giving us a chance! 💙

- The Eintercon Team`
};

class CohortManager {
    constructor() {
        this.cohorts = {};
        this.loaded = false;
    }

    async initialize() {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(DATA_DIR, { recursive: true });
            
            // Load existing cohort data
            try {
                const data = await fs.readFile(COHORT_FILE, 'utf-8');
                this.cohorts = JSON.parse(data);
                console.log('✅ Loaded cohort data');
            } catch (error) {
                // File doesn't exist, create it with empty data
                this.cohorts = {};
                await this.save();
                console.log('✅ Created new cohort data file');
            }
            
            this.loaded = true;
        } catch (error) {
            console.error('❌ Error initializing cohort manager:', error);
            this.cohorts = {};
        }
    }

    async save() {
        try {
            await fs.writeFile(COHORT_FILE, JSON.stringify(this.cohorts, null, 2));
        } catch (error) {
            console.error('❌ Error saving cohort data:', error);
        }
    }

    // Get or create cohort data for a group
    getCohort(groupId) {
        if (!this.cohorts[groupId]) {
            this.cohorts[groupId] = {
                members: [],
                memberCount: 0,
                templates: { ...DEFAULT_TEMPLATES },
                settings: {
                    sendDM: true,
                    sendGroupMessage: true,
                    trackLeavers: true,
                    sendExitSurvey: true
                },
                createdAt: new Date().toISOString()
            };
        }
        return this.cohorts[groupId];
    }

    // Add a new member to the cohort
    async addMember(groupId, memberId, memberName) {
        const cohort = this.getCohort(groupId);
        
        // Check if member already exists
        const existingMember = cohort.members.find(m => m.id === memberId);
        if (existingMember) {
            return existingMember;
        }

        // Increment member count and add member
        cohort.memberCount++;
        const joinDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const newMember = {
            id: memberId,
            name: memberName,
            number: cohort.memberCount,
            joinedAt: new Date().toISOString(),
            joinDate: joinDate
        };
        
        cohort.members.push(newMember);
        await this.save();
        
        return newMember;
    }

    // Remove a member from the cohort
    async removeMember(groupId, memberId) {
        const cohort = this.getCohort(groupId);
        const memberIndex = cohort.members.findIndex(m => m.id === memberId);
        
        if (memberIndex === -1) return null;
        
        const member = cohort.members[memberIndex];
        cohort.members.splice(memberIndex, 1);
        await this.save();
        
        return member;
    }

    // Get member info
    getMember(groupId, memberId) {
        const cohort = this.getCohort(groupId);
        return cohort.members.find(m => m.id === memberId);
    }

    // Update templates
    async updateTemplate(groupId, templateType, content) {
        const cohort = this.getCohort(groupId);
        if (cohort.templates[templateType] !== undefined) {
            cohort.templates[templateType] = content;
            await this.save();
            return true;
        }
        return false;
    }

    // Get template with replacements
    getFormattedMessage(groupId, templateType, replacements = {}) {
        const cohort = this.getCohort(groupId);
        let template = cohort.templates[templateType] || DEFAULT_TEMPLATES[templateType] || '';
        
        // Replace all placeholders
        for (const [key, value] of Object.entries(replacements)) {
            template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        
        return template;
    }

    // Update settings
    async updateSettings(groupId, settings) {
        const cohort = this.getCohort(groupId);
        cohort.settings = { ...cohort.settings, ...settings };
        await this.save();
    }

    // Get cohort stats
    getStats(groupId) {
        const cohort = this.getCohort(groupId);
        return {
            totalMembers: cohort.memberCount,
            currentMembers: cohort.members.length,
            membersLeft: cohort.memberCount - cohort.members.length
        };
    }

    // Reset templates to default
    async resetTemplates(groupId) {
        const cohort = this.getCohort(groupId);
        cohort.templates = { ...DEFAULT_TEMPLATES };
        await this.save();
    }

    // Get all cohorts (for admin overview)
    getAllCohorts() {
        return Object.keys(this.cohorts).map(groupId => ({
            groupId,
            ...this.getStats(groupId)
        }));
    }
}

export default CohortManager;
