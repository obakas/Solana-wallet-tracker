export function Input({ ...props }) {
    return (
        <input
            className="w-full px-4 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            {...props}
        />
    );
}
