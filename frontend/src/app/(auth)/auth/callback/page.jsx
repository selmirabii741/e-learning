'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') router.replace('/admin');
            else if (user.role === 'instructor') {
                // If professor is not approved yet, redirect to certificate upload
                if (user.status && user.status !== 'approved') {
                    router.replace('/pending-approval');
                } else {
                    router.replace('/instructor');
                }
            }
            else router.replace('/dashboard');
            return;
        }
        // Fallback: if no user after 3s, redirect to homepage
        const timeout = setTimeout(() => {
            router.replace('/');
        }, 3000);
        return () => clearTimeout(timeout);
    }, [user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-[#4F46E5] animate-spin" />
                <p className="text-[#64748B] text-sm">Redirection en cours...</p>
            </div>
        </div>
    );
}
