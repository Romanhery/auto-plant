"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeListener() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        console.log("RealtimeListener mounted: Subscribing to database changes...");

        const channel = supabase
            .channel("any_table_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                },
                (payload) => {
                    console.log("Realtime change received:", payload);
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router, supabase]);

    return null;
}
