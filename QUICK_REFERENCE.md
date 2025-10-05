# 🎨 Cohort Bot - Quick Reference Guide

## ✅ What's New

### 1. 🚫 **Group-Only Mode**
- Bot now **IGNORES all private/1-1 messages**
- Only responds to commands in groups where it's a member
- More focused and prevents spam

### 2. 🎯 **@Mention Tagging**
- Welcome messages now **TAG/MENTION the new member** using `@`
- Makes messages feel super personalized
- Everyone sees who just joined with a blue mention

### 3. ✨ **Beautiful Visual Design**
- All menus redesigned with emojis and borders
- Professional box-style formatting
- Easy to read and visually appealing

---

## 📱 Sample Welcome Message (Group Announcement)

```
╔══════════════════════╗
║  🎊 NEW MEMBER ALERT 🎊  ║
╚══════════════════════╝

Everyone, let's give a warm welcome to @JohnDoe! 👏

🎯 Member Number: #5
📅 Joined: Oct 5, 2025

Drop a 👋 to welcome them to our amazing cohort!
```

*(The @JohnDoe will appear as a blue clickable mention)*

---

## 🎨 New Menu Design

When someone types `!help`, they see:

```
╔═══════════════════════════╗
║  🤖 COHORT BOT COMMANDS  ║
╚═══════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  👥 EVERYONE CAN USE  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

📖 !help
   └─ Show this help menu

📊 !stats
   └─ View cohort statistics
...
```

---

## 🔧 Template Variables

Use these in your custom messages:

| Variable | Output | Example |
|----------|--------|---------|
| `{{memberName}}` | Member's name | "Sarah" |
| `{{memberNumber}}` | Sequential number | "#47" |
| `@{{memberId}}` | **@Mention (NEW!)** | "@233504633473" |
| `{{groupName}}` | Group name | "Digital Creators" |
| `{{joinDate}}` | Join date | "Oct 5, 2025" |

---

## 💡 How to Customize with @Mentions

### Example: Set Group Announcement

```
!setgroup 🎉 Welcome @{{memberId}} to {{groupName}}!

You're our member #{{memberNumber}}. Let's grow together! 🚀

Say hi everyone! 👋
```

**Result when Sarah joins:**
> 🎉 Welcome @Sarah to Digital Creators!
> 
> You're our member #47. Let's grow together! 🚀
> 
> Say hi everyone! 👋

*(The @Sarah will be a clickable blue mention)*

---

## 🎯 Key Features

✅ **Auto-welcome** with DM + group announcement  
✅ **Sequential numbering** (#1, #2, #3...)  
✅ **@Mention tagging** for personalization  
✅ **Group-only** operation (no 1-1 messages)  
✅ **Beautiful formatting** with emojis & boxes  
✅ **Admin controls** for all settings  
✅ **Persistent storage** across restarts  

---

## 🚀 Test Commands

Try these in your group:

1. `!help` - See the beautiful new menu
2. `!stats` - View formatted statistics
3. `!mynumber` - Check your profile card
4. `!viewtemplates` (admin) - See all templates
5. `!settings` (admin) - View configuration

---

## 🎨 Default Templates

All default templates now include:
- ✨ Emojis and visual elements
- 📱 @Mention placeholders
- 📅 Join date display
- 🎯 Professional formatting

---

## 📝 Notes

- **Bot only works in groups** (ignores DMs)
- **@Mentions work automatically** when you use `@{{memberId}}`
- **All commands start with `!`**
- **Admin commands require group admin status**
- **Templates are saved per-group** (each group can have different messages)

---

Enjoy your enhanced cohort bot! 🎊
