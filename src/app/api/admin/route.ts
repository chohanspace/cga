
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ref, get, remove, update } from "firebase/database";

const ADMIN_ACCESS_KEY = '36572515';

async function verifyAdmin(request: Request) {
    const authHeader = request.headers.get('Authorization');
    return authHeader === `Bearer ${ADMIN_ACCESS_KEY}`;
}

// GET all users and live chat messages
export async function GET(request: Request) {
    if (!(await verifyAdmin(request))) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const usersRef = ref(db, 'users');
        const usersSnapshot = await get(usersRef);
        let usersData = {};
        if (usersSnapshot.exists()) {
            usersData = usersSnapshot.val();
            // Remove sensitive data before sending to client
            Object.keys(usersData).forEach(username => {
                delete usersData[username].password;
                delete usersData[username].otp;
                delete usersData[username].otpExpires;
            });
        }
        
        const liveMessagesRef = ref(db, 'live-chats/general/messages');
        const liveMessagesSnapshot = await get(liveMessagesRef);
        const liveMessagesData = liveMessagesSnapshot.exists() ? liveMessagesSnapshot.val() : {};

        return NextResponse.json({ users: usersData, liveMessages: liveMessagesData }, { status: 200 });

    } catch (error) {
        console.error('Admin GET Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST for various admin actions
export async function POST(request: Request) {
    if (!(await verifyAdmin(request))) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { action, username, newPassword, messageId } = await request.json();

        if (!action) {
            return NextResponse.json({ message: 'Action is required' }, { status: 400 });
        }

        switch (action) {
            case 'delete-user': {
                if (!username) return NextResponse.json({ message: 'Username is required' }, { status: 400 });
                const userRef = ref(db, `users/${username}`);
                const userSnapshot = await get(userRef);
                if (!userSnapshot.exists()) return NextResponse.json({ message: 'User not found' }, { status: 404 });
                
                const chatsRef = ref(db, `chats/${username}`);
                const chatsSnapshot = await get(chatsRef);

                await remove(userRef);
                if (chatsSnapshot.exists()) {
                    await remove(chatsRef);
                }
                
                return NextResponse.json({ message: 'User and their associated data deleted successfully' }, { status: 200 });
            }
            
            case 'reset-password': {
                if (!username) return NextResponse.json({ message: 'Username is required' }, { status: 400 });
                const userRef = ref(db, `users/${username}`);
                const userSnapshot = await get(userRef);
                if (!userSnapshot.exists()) return NextResponse.json({ message: 'User not found' }, { status: 404 });

                if (!newPassword || newPassword.length < 6) {
                    return NextResponse.json({ message: 'New password must be at least 6 characters' }, { status: 400 });
                }
                await update(userRef, { password: newPassword });
                return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
            }
            
            case 'delete-live-chat-message': {
                if (!messageId) return NextResponse.json({ message: 'Message ID is required' }, { status: 400 });
                const messageRef = ref(db, `live-chats/general/messages/${messageId}`);
                const messageSnapshot = await get(messageRef);
                if (!messageSnapshot.exists()) return NextResponse.json({ message: 'Message not found' }, { status: 404 });

                await remove(messageRef);
                return NextResponse.json({ message: 'Live chat message deleted successfully' }, { status: 200 });
            }

            default:
                return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Admin POST Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
