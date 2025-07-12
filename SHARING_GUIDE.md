# Sharing Compositions Guide

## Overview

The St Cecilia's Songbook app now supports sharing compositions through direct links. Users can share their compositions with others, and recipients can access them even without being logged in (with appropriate prompts).

## How to Share a Composition

### For Composition Owners

1. **Save your composition to the cloud first**
   - Click the "Save to Cloud" button in the navigation
   - Fill in the composition details and save

2. **Generate a shareable link**
   - Once saved to cloud, a blue "Share" button will appear next to the composition title
   - Click the share button to copy the link to your clipboard
   - The link will be in the format: `https://your-app-domain.com/shared/[composition-id]`

3. **Share the link**
   - Send the copied link to anyone you want to share with
   - The link will work for anyone who has access to the composition

## How to Access Shared Compositions

### For Recipients

1. **Click the shared link**
   - The link will open the app and automatically load the shared composition
   - If you're not logged in, you'll see a login prompt

2. **Authentication (if required)**
   - If the composition requires authentication, you'll see a login modal
   - Click "Sign in with Google" to authenticate
   - After signing in, the composition will automatically load

3. **View the composition**
   - Shared compositions open in read-only mode by default
   - You can view and play the composition
   - If you have edit permissions, you can toggle to edit mode

## Access Control

### Public Compositions
- Anyone can access public compositions without logging in
- The composition owner can optionally allow public editing

### Private Compositions
- Only the owner can access private compositions
- These cannot be shared via link

### Shared Compositions
- Only users explicitly shared with can access
- Recipients must be logged in to access
- Permissions can be read-only or read-write

## URL Structure

Shared composition URLs follow this pattern:
```
https://your-app-domain.com/shared/[composition-id]
```

Example:
```
https://st-cecilia-songbook.web.app/shared/abc123def456
```

## Security Features

- **Authentication Required**: Private and shared compositions require login
- **Access Control**: Only users with proper permissions can access compositions
- **Read-Only by Default**: Shared compositions open in read-only mode for safety
- **Permission-Based Editing**: Users can only edit if they have write permissions

## Troubleshooting

### "Composition not found" Error
- The composition may have been deleted
- You may not have access to this composition
- The composition ID in the URL may be incorrect

### "Login Required" Prompt
- This is normal for private/shared compositions
- Sign in with Google to access the composition
- After signing in, the composition will load automatically

### "You do not have access" Error
- The composition owner may have revoked your access
- The composition may have been made private
- Contact the composition owner for access

## Technical Details

### Implementation
- Uses Vue Router with dynamic routes (`/shared/:id`)
- Firebase Firestore for composition storage and access control
- Google Authentication for user management
- Automatic composition loading and permission checking

### Browser Compatibility
- Works in all modern browsers
- Requires JavaScript enabled
- Supports mobile and desktop devices

### Performance
- Compositions are loaded on-demand
- Caching is used for better performance
- Minimal data transfer for shared compositions 