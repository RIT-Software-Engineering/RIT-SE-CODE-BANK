/**
 * User Profile Types
 * 
 * Defines the basic user profile structure shared by PeerEval
 * components.
 * 
 * Contains the user's ID, display name, and email address.
 */
export interface UserProfile {
    id: string;
    name: string;
    email: string;
}