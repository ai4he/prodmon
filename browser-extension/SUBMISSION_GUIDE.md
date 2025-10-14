# Browser Extension Submission Guide

This guide walks you through submitting the Productivity Monkey browser extension to Chrome Web Store, Edge Add-ons, and Firefox Add-ons.

## Prerequisites

Before you begin, ensure you have:

- ✅ Extension packages created (`browser-extension/dist/productivity-monkey-chrome.zip` and `productivity-monkey-firefox.zip`)
- ✅ Icons in PNG format (16, 32, 48, 96, 128)
- ✅ Screenshots (3-5 images at 1280x800 or higher)
- ✅ Store descriptions from `STORE_LISTING.md`
- ✅ Privacy policy published online
- ✅ Support/homepage URL (website or GitHub repo)
- ✅ Developer accounts for each platform

---

## 1. Chrome Web Store Submission

### Step 1: Set Up Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the one-time $5 developer registration fee
4. Complete your developer profile

### Step 2: Create New Item

1. Click **"New Item"** button
2. Upload `browser-extension/dist/productivity-monkey-chrome.zip`
3. Click **"Upload"**
4. Wait for the upload to process

### Step 3: Fill Store Listing

Navigate through the tabs and fill in the information:

#### Product Details Tab

- **Extension Name:** Productivity Monkey - Browser Tracker
- **Summary:** (Copy from STORE_LISTING.md - 132 chars max)
- **Description:** (Copy detailed description from STORE_LISTING.md)
- **Category:** Productivity
- **Language:** English (United States)

#### Graphics Tab

Upload the following assets:

1. **Icon** (128x128 PNG - required):
   - Upload `browser-extension/chrome/icons/icon128.png`

2. **Screenshots** (1280x800 or 1920x1080 - at least 1 required, up to 5):
   - Upload your 3-5 screenshots showing the extension in action
   - Add captions for each screenshot

3. **Small Promotional Tile** (440x280 PNG - required):
   - Create a promotional image with logo and tagline
   - Tools: Canva, Figma, Photoshop

4. **Marquee Promotional Tile** (1400x560 PNG - optional):
   - Create a larger promotional banner
   - Shows key features and benefits

5. **Video** (YouTube URL - optional but recommended):
   - Upload demo video to YouTube
   - Add the video URL

#### Distribution Tab

- **Visibility:** Public
- **Countries:** All countries (or select specific regions)
- **Pricing:** Free

#### Privacy Tab

- **Single Purpose:** Track browser activity for productivity monitoring
- **Host Permissions Justification:**
  ```
  The extension requires access to all URLs (<all_urls>) to:
  1. Track browsing activity across all websites
  2. Inject content scripts to monitor user engagement
  3. Detect media playback for accurate activity categorization
  4. Measure time spent on each website
  This data is stored locally and synced with the Productivity Monkey desktop app via native messaging. No data is sent to external servers.
  ```
- **Remote Code:** No
- **Privacy Policy:** [Your privacy policy URL]
- **Data Usage:** Check all applicable boxes and explain:
  - Website activity: "Track URLs, page titles, and time spent"
  - User activity: "Count keystrokes, clicks, scrolling (not recorded)"
  - Location: "Not collected"
  - Personal info: "User ID for data association"

### Step 4: Submit for Review

1. Review all information
2. Click **"Submit for Review"**
3. Wait for review (typically 1-3 business days)
4. Monitor your email for review feedback

### Common Review Issues

- **Permissions too broad:** Justify all permissions clearly
- **Privacy concerns:** Emphasize no content logging, local-first approach
- **Functionality unclear:** Provide detailed video demo
- **Native messaging:** Explain desktop app requirement

---

## 2. Edge Add-ons Submission

### Step 1: Set Up Developer Account

1. Go to [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
2. Sign in with your Microsoft account
3. Enroll in the Microsoft Edge program (free)
4. Complete your profile

### Step 2: Create New Submission

1. Navigate to **Extensions** → **Overview**
2. Click **"Create new extension"**
3. **Upload Package:**
   - Upload `browser-extension/dist/productivity-monkey-chrome.zip`
   - Note: Edge uses the same package as Chrome (Manifest V3)

### Step 3: Fill Product Details

#### Properties

- **Display Name:** Productivity Monkey - Browser Tracker
- **Category:** Productivity
- **Privacy Policy URL:** [Your privacy policy URL]
- **Support Website:** [Your website or GitHub]

#### Listings

- **Description:** (Copy detailed description from STORE_LISTING.md)
- **Short Description:** (Copy from STORE_LISTING.md)
- **Screenshots:** Upload 3-5 screenshots (1280x800 or 1920x1080)
- **Icon:** Upload 128x128 PNG icon
- **Promotional Assets:** (Optional) Upload promotional images

#### Availability

- **Markets:** All markets (or select specific regions)
- **Pricing:** Free

### Step 4: Certification Notes

Provide notes for reviewers:

```
This extension tracks browser activity for the Productivity Monkey productivity monitoring application.

Setup Requirements:
1. Install Productivity Monkey desktop app (available at [website])
2. Install this extension
3. Configure native messaging (automated via desktop app)

Test Instructions:
1. Install the desktop app
2. Install the extension
3. Browse a few websites
4. View tracked activity in the desktop app dashboard

Native Messaging:
The extension requires the desktop app to function. All data is stored locally on the user's machine. No external servers are involved.

Privacy:
- Keystroke counts only (content never logged)
- No screenshots or content capture
- All data stored locally
- User consent required
```

### Step 5: Submit

1. Review all information
2. Click **"Submit"**
3. Wait for review (typically 3-7 business days)

---

## 3. Firefox Add-ons Submission

### Step 1: Set Up Developer Account

1. Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
2. Sign in with your Firefox account (or create one)
3. Complete your profile (no registration fee)

### Step 2: Submit New Add-on

1. Click **"Submit a New Add-on"**
2. Choose **"On this site"** (AMO)
3. Upload `browser-extension/dist/productivity-monkey-firefox.zip`
4. Wait for validation (automatic)

### Step 3: Fill Add-on Details

#### Basic Information

- **Name:** Productivity Monkey - Browser Tracker
- **Add-on URL:** productivity-monkey (if available)
- **Summary:** (Copy from STORE_LISTING.md - 250 chars max)
- **Description:** (Copy detailed description from STORE_LISTING.md)
- **Categories:**
  - Primary: Other
  - Secondary: Privacy & Security

#### Additional Details

- **Homepage:** [Your website or GitHub]
- **Support Email:** [Your support email]
- **Support Website:** [Your support/docs URL]
- **License:** Choose appropriate license (e.g., MIT)
- **Privacy Policy:** [Your privacy policy URL]

#### Version Information

- **Version Notes:**
  ```
  Version 1.0.0 - Initial Release

  Features:
  - Precise URL and time tracking
  - Engagement metrics (keystrokes, clicks, scrolling)
  - Automatic site categorization
  - Media detection
  - Native messaging integration
  - Privacy-first design

  Requirements:
  - Productivity Monkey desktop app
  - Native messaging setup
  ```

- **Release Notes:**
  ```
  First public release of Productivity Monkey Browser Tracker.
  Requires the Productivity Monkey desktop application.
  See homepage for setup instructions.
  ```

#### Media

- **Icon:** Upload 128x128 PNG icon
- **Screenshots:** Upload 3-5 screenshots
- **Add-on Icon:** Your 48x48 icon (optional)

### Step 4: Technical Details

#### Platforms
- ✅ Firefox for Desktop
- ✅ Firefox for Android (if compatible)

#### Compatibility
- **Minimum Version:** 91.0 (as specified in manifest)
- **Maximum Version:** * (any)

### Step 5: Review Notes for Reviewers

Provide detailed notes:

```
Productivity Monkey Browser Tracker - Review Notes

IMPORTANT: This extension requires the Productivity Monkey desktop application to function.

Setup for Testing:
1. Download Productivity Monkey desktop app from [URL or GitHub releases]
2. Install and run the desktop app
3. Install this extension
4. Native messaging will be configured automatically by the desktop app
5. Browse websites to generate activity data
6. Open the desktop app dashboard to view tracked activity

How It Works:
- Extension tracks browser activity (URLs, time, engagement)
- Data sent to desktop app via native messaging
- No external servers or data transmission
- All data stored locally on user's machine

Permissions Justification:
- tabs, webNavigation: Track tab changes and page navigation
- storage: Store user ID and preferences
- idle: Detect when user is away
- nativeMessaging: Communicate with desktop app
- <all_urls>: Monitor activity across all websites

Privacy:
- Keystrokes counted but NOT logged
- No content capture or screenshots
- Open source and auditable
- Local-first data storage

Demo Video: [YouTube link if available]

Contact: [Your email] for questions during review
```

### Step 6: Submit for Review

1. Review all information
2. Check the declaration boxes
3. Click **"Submit Version"**
4. Wait for review (typically 1-10 days, can vary)

---

## Post-Submission Checklist

After submitting to all stores:

### Immediate Actions

- [ ] Save submission confirmation emails
- [ ] Note down submission dates
- [ ] Set calendar reminders to check status
- [ ] Monitor email for review updates

### During Review Period

- [ ] Respond promptly to any reviewer questions
- [ ] Prepare additional materials if requested
- [ ] Test the live listing once approved
- [ ] Verify store links work correctly

### After Approval

- [ ] Update your website with store links
- [ ] Add install badges to README and documentation
- [ ] Announce the release (blog, social media, etc.)
- [ ] Monitor reviews and ratings
- [ ] Respond to user reviews
- [ ] Track installation metrics
- [ ] Gather user feedback for improvements

### Maintenance

- [ ] Plan regular updates
- [ ] Monitor browser API changes
- [ ] Test with new browser versions
- [ ] Update manifest versions as needed
- [ ] Maintain compatibility
- [ ] Address security concerns promptly

---

## Store Links (After Approval)

Once approved, your extensions will be available at:

### Chrome Web Store
```
https://chrome.google.com/webstore/detail/[your-extension-id]
```

### Edge Add-ons
```
https://microsoftedge.microsoft.com/addons/detail/[your-extension-id]
```

### Firefox Add-ons
```
https://addons.mozilla.org/firefox/addon/productivity-monkey/
```

Add these to your documentation and website!

---

## Troubleshooting Common Issues

### Rejection: Too Many Permissions

**Solution:** Provide detailed justification for each permission in your privacy section. Explain why `<all_urls>` is necessary (tracking across all sites).

### Rejection: Privacy Concerns

**Solution:**
- Emphasize local-first approach
- Explain that content is never logged
- Provide clear privacy policy
- Show that no external servers are used

### Rejection: Unclear Functionality

**Solution:**
- Create detailed demo video
- Provide test account or detailed test instructions
- Explain native messaging requirement clearly
- Show screenshots of desktop app integration

### Rejection: Requires Desktop App

**Solution:**
- Clearly state this requirement in description
- Provide easy access to desktop app
- Show that this is an intentional design (not a bug)
- Explain the value of the integration

### Rejection: Manifest Issues

**Solution:**
- Validate manifest.json
- Check all required fields are present
- Ensure icon paths are correct
- Test locally before resubmitting

---

## Getting Help

If you encounter issues:

1. **Chrome Web Store:**
   - [Help Center](https://support.google.com/chrome_webstore/)
   - [Developer Forum](https://groups.google.com/a/chromium.org/g/chromium-extensions)

2. **Edge Add-ons:**
   - [Microsoft Documentation](https://docs.microsoft.com/microsoft-edge/extensions-chromium/)
   - [Partner Center Support](https://partner.microsoft.com/support)

3. **Firefox Add-ons:**
   - [Extension Workshop](https://extensionworkshop.com/)
   - [Developer Hub Help](https://developer.mozilla.org/docs/Mozilla/Add-ons)
   - [Add-ons Discourse](https://discourse.mozilla.org/c/add-ons/)

---

## Quick Command Reference

```bash
# Package extensions
node browser-extension/package-extensions.js

# Verify package contents
unzip -l browser-extension/dist/productivity-monkey-chrome.zip
unzip -l browser-extension/dist/productivity-monkey-firefox.zip

# Test locally before submission
# Chrome: chrome://extensions → Load unpacked → select chrome folder
# Firefox: about:debugging → Load Temporary Add-on → select manifest.json

# Check manifest validation
# Chrome: Will auto-validate on upload
# Firefox: Will auto-validate on upload
```

---

## Timeline Expectations

| Store | Review Time | Total Time to Live |
|-------|-------------|-------------------|
| Chrome Web Store | 1-3 business days | 1-4 days |
| Edge Add-ons | 3-7 business days | 3-10 days |
| Firefox Add-ons | 1-10 days (varies) | 1-14 days |

**Note:** First submissions typically take longer than updates. Complex extensions may require additional review time.

---

## Success Criteria

Your submission is ready when:

- ✅ All required fields are filled
- ✅ Screenshots clearly show functionality
- ✅ Description explains value and usage
- ✅ All permissions are justified
- ✅ Privacy policy is clear and accessible
- ✅ Test instructions are provided
- ✅ Package validates without errors
- ✅ Icons are properly formatted
- ✅ Desktop app is available for reviewers

Good luck with your submission! 🚀
