# Publishing Browser Extensions - Quick Start

This is a quick reference guide for publishing the Productivity Monkey browser extensions. For detailed instructions, see `SUBMISSION_GUIDE.md`.

## Pre-Publishing Checklist

Before you start, you need:

1. **Extension Packages** ✅
   - `browser-extension/dist/productivity-monkey-chrome.zip` (for Chrome & Edge)
   - `browser-extension/dist/productivity-monkey-firefox.zip` (for Firefox)

2. **Store Assets** ⚠️ **ACTION REQUIRED**
   - [ ] Create 3-5 screenshots (1280x800 minimum)
   - [ ] Create promotional tile (440x280 PNG for Chrome)
   - [ ] Optional: Create marquee image (1400x560 PNG)
   - [ ] Optional: Create demo video (30-60 seconds)

3. **Documentation** ⚠️ **ACTION REQUIRED**
   - [ ] Publish privacy policy online
   - [ ] Create support page or use GitHub
   - [ ] Ensure desktop app is available for download

4. **Developer Accounts** ⚠️ **ACTION REQUIRED**
   - [ ] Chrome Web Store ($5 one-time fee)
   - [ ] Microsoft Partner Center (free)
   - [ ] Firefox Add-ons Developer Hub (free)

## Quick Publish Steps

### 1. Chrome Web Store (1-3 days review)

```
1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay $5 registration fee (one-time)
3. Click "New Item"
4. Upload: browser-extension/dist/productivity-monkey-chrome.zip
5. Fill in store listing details (see STORE_LISTING.md)
6. Upload screenshots and icons
7. Add privacy policy URL
8. Submit for review
```

**Key Points:**
- Justify `<all_urls>` permission (required for tracking)
- Emphasize privacy-first approach
- Explain native messaging requirement

### 2. Edge Add-ons (3-7 days review)

```
1. Go to: https://partner.microsoft.com/dashboard
2. Enroll in Edge program (free)
3. Create new extension
4. Upload: browser-extension/dist/productivity-monkey-chrome.zip (same as Chrome)
5. Fill in product details
6. Add certification notes for reviewers
7. Submit
```

**Key Points:**
- Uses same package as Chrome (Manifest V3)
- Provide test instructions in certification notes
- Explain desktop app requirement

### 3. Firefox Add-ons (1-10 days review)

```
1. Go to: https://addons.mozilla.org/developers/
2. Create account (free)
3. Submit new add-on
4. Upload: browser-extension/dist/productivity-monkey-firefox.zip
5. Fill in add-on details
6. Add detailed review notes
7. Submit
```

**Key Points:**
- Uses Manifest V2
- Review times vary widely
- Provide comprehensive testing instructions

## Store Listing Copy

All store descriptions, categories, and permissions justifications are in:
📄 **`STORE_LISTING.md`**

## Detailed Submission Instructions

Complete step-by-step guides for each store are in:
📄 **`SUBMISSION_GUIDE.md`**

## After Submission

1. **Monitor Email** - Reviewers may ask questions
2. **Respond Quickly** - Fast responses = faster approval
3. **Be Patient** - Review times vary by store
4. **Update Documentation** - Add store links once approved

## Common Rejection Reasons & Solutions

| Issue | Solution |
|-------|----------|
| Too many permissions | Justify each permission clearly |
| Privacy concerns | Emphasize local-first, no content logging |
| Unclear functionality | Add demo video and detailed instructions |
| Requires desktop app | Clearly state requirement, provide download link |

## Store URLs (After Approval)

Once approved, update these everywhere:

- **Chrome:** `https://chrome.google.com/webstore/detail/[extension-id]`
- **Edge:** `https://microsoftedge.microsoft.com/addons/detail/[extension-id]`
- **Firefox:** `https://addons.mozilla.org/firefox/addon/productivity-monkey/`

## Need Help?

- 📖 Full guide: `SUBMISSION_GUIDE.md`
- 📋 Store listing copy: `STORE_LISTING.md`
- 🔧 Technical details: `README.md`

## Pro Tips

1. **Submit in parallel** - Don't wait for one store before submitting to others
2. **Create quality screenshots** - This is your main selling point
3. **Make a demo video** - Significantly improves approval chances
4. **Respond fast** - Check email daily during review period
5. **Test locally first** - Load unpacked and verify everything works
6. **Update version notes** - Clear notes help reviewers understand changes

## Files Created for Publishing

```
browser-extension/
├── dist/
│   ├── productivity-monkey-chrome.zip    ✅ Ready
│   └── productivity-monkey-firefox.zip   ✅ Ready
├── chrome/icons/                         ✅ All PNG icons created
├── firefox/icons/                        ✅ All PNG icons created
├── STORE_LISTING.md                      ✅ All copy ready
├── SUBMISSION_GUIDE.md                   ✅ Complete instructions
└── PUBLISH.md                            ✅ This file
```

## What You Still Need

### Required ⚠️

1. **Screenshots** (3-5 images)
   - Show dashboard with browser data
   - Show extension popup
   - Show site categorization
   - Size: 1280x800 or higher

2. **Privacy Policy**
   - Host on your website or GitHub Pages
   - Include URL in store listings

3. **Developer Accounts**
   - Chrome: $5 fee
   - Edge: Free enrollment
   - Firefox: Free account

### Recommended ✨

1. **Demo Video**
   - 30-60 seconds
   - Show installation and usage
   - Upload to YouTube

2. **Promotional Images**
   - Small tile: 440x280 PNG
   - Marquee: 1400x560 PNG
   - Use Canva or Figma

3. **Support Website**
   - Documentation site
   - Or use GitHub repository

## Commands

```bash
# Re-package if you make changes
node browser-extension/package-extensions.js

# Verify package contents
unzip -l browser-extension/dist/productivity-monkey-chrome.zip

# Test locally before submitting
# Chrome: chrome://extensions → Load unpacked
# Firefox: about:debugging → Load Temporary Add-on
```

## Timeline

| Task | Time Required |
|------|---------------|
| Create screenshots | 30-60 minutes |
| Create promotional images | 30-60 minutes |
| Write/publish privacy policy | 1-2 hours |
| Set up developer accounts | 30 minutes each |
| Fill out store listings | 1-2 hours per store |
| **Total prep time** | **4-6 hours** |
| Chrome review | 1-3 business days |
| Edge review | 3-7 business days |
| Firefox review | 1-10 business days |
| **Total time to live** | **3-10 days** |

## Next Steps

1. **Create Required Assets** (screenshots, privacy policy)
2. **Set Up Developer Accounts** (all three stores)
3. **Follow SUBMISSION_GUIDE.md** (step-by-step for each store)
4. **Submit All Three** (in parallel for faster launch)
5. **Monitor and Respond** (check email daily)
6. **Celebrate! 🎉** (once approved)

Good luck with your launch! 🚀
