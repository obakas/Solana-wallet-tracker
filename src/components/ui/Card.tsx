import { ReactNode } from "react";

type CardContentProps = {
    children: ReactNode;
    className?: string;
};

export function Card({ children }: { children: ReactNode }) {
    return <div className="border rounded shadow bg-white">{children}</div>;
}


export function CardContent({ children, className }: CardContentProps) {
    return <div className={`p-4 ${className}`}>{children}</div>;
}
