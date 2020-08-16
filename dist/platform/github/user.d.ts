export interface UserDetails {
    username: string;
    name: string;
}
export declare function getUserDetails(endpoint: string, token: string): Promise<UserDetails>;
export declare function getUserEmail(endpoint: string, token: string): Promise<string | null>;
