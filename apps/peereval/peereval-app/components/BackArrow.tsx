"use client";

import { useRouter } from "next/navigation";
import { BackButton } from "@rit/peereval-components";

export default function BackArrow() {
    const router = useRouter();

    return (
        <BackButton
            onClick={() => router.push("/dashboard")}
        />
    );
}