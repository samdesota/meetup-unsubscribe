# Meetup Group Manager

Manage your group memberships efficiently with bulk unsubscribe.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/meetup-group-manager.git
cd meetup-group-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser to:
```
http://localhost:3001
```

## 📖 How to Use

### Step 1: Get Your Cookie

1. Open [meetup.com](https://meetup.com) and log in
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to the **Network** tab
4. Refresh the page
5. Click on any request to meetup.com
6. Find the **Request Headers** section
7. Copy the entire `Cookie` header value

**Need help?** Click the "Detailed Instructions" button in the app for browser-specific guides.

### Step 2: Authenticate

1. Click the **Authentication** section to expand it
2. Paste your cookie into the textarea
3. Click **Save Cookie**
4. The status will change to "✓ Set" in green

### Step 3: Load Your Groups

1. Click **Load My Groups**
2. Wait for all groups to load (pagination is automatic)
3. You'll see all your Meetup groups displayed as cards

### Step 4: Select & Unsubscribe

1. Use the search box to filter groups (optional)
2. Click on group cards or checkboxes to select them
3. Or use **Select All** / **Deselect All** buttons
4. Click **Unsubscribe** to leave selected groups
5. Watch the progress modal track the operation
