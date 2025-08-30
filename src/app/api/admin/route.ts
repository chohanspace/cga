import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ref, get, remove, update } from "firebase/database";

const ADMIN_ACCESS_KEY = '36572515';

async function verifyAdmin(request: Request) {
    const authHeader = request.headers.get('Authorization');
    return authHeader === `Bearer ${ADMIN_ACCESS_KEY}`;
}

// GET all users
export async function GET(request: Request) {
    if (!(await verifyAdmin(request))) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            // Remove sensitive data before sending to client
            Object.keys(usersData).forEach(username => {
                delete usersData[username].password;
                delete usersData[username].otp;
                delete usersData[username].otpExpires;
            });
            return NextResponse.json(usersData, { status: 200 });
        } else {
            return NextResponse.json({}, { status: 200 });
        }
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
        const { action, username, newPassword } = await request.json();

        if (!action || !username) {
            return NextResponse.json({ message: 'Action and username are required' }, { status: 400 });
        }

        const userRef = ref(db, `users/${username}`);
        const userSnapshot = await get(userRef);
        if (!userSnapshot.exists()) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        switch (action) {
            case 'delete-user':
                // Also delete user's chats
                const chatsRef = ref(db, `chats/${username}`);
                await remove(userRef);
                await remove(chatsRef);
                return NextResponse.json({ message: 'User and their chats deleted successfully' }, { status: 200 });
            
            case 'reset-password':
                if (!newPassword || newPassword.length < 6) {
                    return NextResponse.json({ message: 'New password must be at least 6 characters' }, { status: 400 });
                }
                await update(userRef, { password: newPassword });
                return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

            // Note: Add/Forgot Pass OTP functionality can be added here later if needed.
            // The existing /api/send-otp could be leveraged or extended.

            default:
                return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Admin POST Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
