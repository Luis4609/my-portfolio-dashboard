interface NotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}
const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    return (
        <div className={`fixed top-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4">&times;</button>
        </div>
    );
};
export default Notification;