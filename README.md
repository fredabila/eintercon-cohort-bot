# WhatsApp Cohort Management Bot

A powerful WhatsApp bot built with Baileys for managing cohorts in your social platform. Automatically welcomes new members with personalized messages, tracks member numbers, and provides admin tools for customization.

## Features

✨ **Automatic Member Onboarding**
- 📧 Sends personalized DM to new members
- 📢 Posts welcome announcement in the group
- 🔢 Assigns sequential member numbers (#1, #2, #3...)
- 💾 Persistent member tracking across restarts

🎨 **Customizable Templates**
- Set custom welcome DM messages
- Set custom group announcement messages
- Use dynamic placeholders (name, number, group name)
- Reset to defaults anytime

👥 **Member Management**
- Track member joins and leaves
- View cohort statistics
- Member number lookup
- Leave notifications

🛡️ **Admin Controls**
- Template customization
- Toggle DM/group messages on/off
- View current settings and stats
- Admin-only commands

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the bot:**
   ```bash
   npm start
   ```

3. **Authenticate:**
   - Scan the QR code with WhatsApp mobile app
   - Go to: Settings → Linked Devices → Link a Device
   - Bot will stay connected and auto-reconnect if disconnected

## Commands

### Everyone Can Use:
- `!help` - Display all available commands
- `!stats` - View cohort statistics (total, current, left members)
- `!mynumber` - See your member number and join date

### Admins Only:
- `!setdm <message>` - Set custom DM welcome template
- `!setgroup <message>` - Set custom group announcement template
- `!viewtemplates` - View all current message templates
- `!resettemplates` - Reset templates to defaults
- `!settings` - View current bot settings
- `!toggledm` - Enable/disable DM welcome messages
- `!togglegroup` - Enable/disable group announcements

## Template Variables

Use these placeholders in your custom templates:

- `{{memberName}}` - The new member's name
- `{{memberNumber}}` - Their sequential number (#1, #2, etc.)
- `{{groupName}}` - The name of the group

### Example Custom Templates:

**DM Welcome:**
```
🎉 Hey {{memberName}}!

Welcome to {{groupName}}! You're member #{{memberNumber}} of our amazing cohort.

Here's what you should do next:
1. Introduce yourself in the group
2. Check out our resources
3. Connect with other members

Let's grow together! 🚀
```

**Group Announcement:**
```
🎊 Everyone, please welcome {{memberName}}!

They are member #{{memberNumber}} of our cohort. Let's make them feel at home! 

Drop a 👋 to say hi!
```

## How It Works

1. **New Member Joins:**
   - Bot detects the join event
   - Assigns next sequential number (e.g., #47)
   - Sends personalized DM with their number
   - Posts welcome announcement in group
   - Saves member data permanently

2. **Member Leaves:**
   - Bot detects the leave event
   - Optionally posts goodbye message
   - Updates member records

3. **Admin Customization:**
   - Admins can customize all messages
   - Settings persist across restarts
   - Each group has independent settings

## Data Storage

All cohort data is stored in `cohort_data/cohorts.json`:
- Member numbers and names
- Join timestamps
- Custom templates per group
- Group settings

**Important:** This file contains your cohort data. Back it up regularly!

## Project Structure

```
eintercon-cohort-bot/
├── src/
│   ├── index.js           # Main bot logic
│   └── cohortManager.js   # Cohort data management
├── auth_info/             # WhatsApp authentication (auto-generated)
├── cohort_data/           # Cohort data storage (auto-generated)
├── package.json
├── .gitignore
└── README.md
```

## Tips for Admins

1. **Test Templates First:** Use `!viewtemplates` to see current messages before changing
2. **Use Variables:** Make templates dynamic with `{{memberName}}`, `{{memberNumber}}`, `{{groupName}}`
3. **Backup Data:** The `cohort_data/` folder contains all member records
4. **Toggle Features:** Use `!toggledm` and `!togglegroup` to control what messages are sent

## Troubleshooting

**Bot not responding?**
- Make sure it's still running (`npm start`)
- Check if QR code needs re-scanning
- Verify bot has not been removed from group

**Commands not working?**
- Ensure you're a group admin for admin commands
- Check command spelling (commands are case-insensitive)
- Make sure messages start with `!`

**Members not getting DMs?**
- Some users have privacy settings blocking messages from unknown numbers
- Check if `!settings` shows DM enabled

## Next Steps

Your bot is ready to manage cohorts! Here's what to do:

1. Add the bot to your group
2. Make sure bot number is a group admin (for some features)
3. Test with `!help` and `!stats`
4. Customize templates with `!setdm` and `!setgroup`
5. Have new members join and watch the magic! ✨

## Support

For issues or feature requests, check the console logs for error messages.

---

Built with ❤️ using [Baileys](https://github.com/WhiskeySockets/Baileys)
