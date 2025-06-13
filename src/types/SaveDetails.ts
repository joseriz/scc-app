export interface SaveDetails {
  title: string;
  author?: string;
  arrangedBy?: string;
  visibility: 'public' | 'private' | 'shared';
  sharedWith?: Array<{ email: string; permission: 'read' | 'write' }>;
  allowPublicWrite?: boolean;
} 