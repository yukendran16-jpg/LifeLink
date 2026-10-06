import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../lib/dbService';
import { NotificationItem } from '../types';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';

interface NotificationDropdownProps {
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
  onNavigate
}) => {
  const { user, activeSimulatedId } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const effectiveId = activeSimulatedId || user?.uid;

  useEffect(() => {
    if (!effectiveId) return;
    loadNotifs();
  }, [effectiveId]);

  const loadNotifs = async () => {
    if (!effectiveId) return;
    setLoading(true);
    try {
      const items = await getUserNotifications(effectiveId);
      setNotifications(items || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleClickItem = async (item: NotificationItem) => {
    if (!item.read) {
      await markNotificationAsRead(item.id);
    }
    onClose();

    if (item.type === 'MATCH_REQUEST') {
      onNavigate('donor');
    } else if (item.type === 'HOSPITAL_VERIFIED' || item.type === 'MATCH_ACCEPTED') {
      onNavigate('hospital');
    } else if (item.type === 'DONATION_COMPLETED') {
      onNavigate('donor');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#162032] border border-white/15 shadow-2xl py-3 z-50 text-white">
      <div className="flex items-center justify-between px-4 pb-2.5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-[#E63950]" />
          <span className="font-bold text-sm text-white">Notifications</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C62845]/20 text-[#E63950] border border-[#E63950]/30 font-mono">
          {unreadCount} Unread
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No active notifications</p>
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => handleClickItem(item)}
              className={`p-3.5 hover:bg-white/5 cursor-pointer transition-colors flex items-start space-x-3 ${
                !item.read ? 'bg-[#C62845]/10' : ''
              }`}
            >
              <div className="mt-1">
                <span
                  className={`w-2 h-2 rounded-full block ${
                    !item.read ? 'bg-[#E63950] ring-2 ring-red-950' : 'bg-slate-600'
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 flex-shrink-0">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-[#E63950] tracking-wider font-mono">
                    {item.type.replace('_', ' ')}
                  </span>
                  {!item.read && (
                    <button
                      onClick={e => handleMarkAsRead(item.id, e)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
