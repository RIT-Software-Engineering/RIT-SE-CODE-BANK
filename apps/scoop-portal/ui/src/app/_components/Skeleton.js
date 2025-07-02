export default function Skeleton({ className }) {
    return (
        <div
            className={`bg-[#7C878E] dark:bg-[#D0D3D4] motion-safe:animate-pulse rounded ${className}`}
        />
    );
}
