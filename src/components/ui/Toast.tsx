import React, { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-slate-800',
    }[type];

    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
    }[type];

    return (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[2500] ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom max-w-sm`}>
            <i className={`fas ${icon}`}></i>
            <span className="text-sm font-bold">{message}</span>
        </div>
    );
};

export default Toast;
