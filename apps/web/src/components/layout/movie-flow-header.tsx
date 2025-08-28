"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogOut, User, Sparkles, PanelsLeftBottom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradientText } from '@/components/ui/gradient-text';
import ReactDOM from 'react-dom';
import { getCurrentUser, logoutUser } from '@/lib/auth-compat';
import '@/styles/top-bar.css';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  token?: string;
}

interface MovieFlowHeaderProps {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function MovieFlowHeader({ 
  collapsed, 
  onToggleSidebar, 
  showSidebarToggle = false 
}: MovieFlowHeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 检查用户登录状态
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 处理点击外部关闭菜单
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    element.classList.remove("on");
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    element.classList.add("on");
  };

  return (
    <div className="fixed right-0 top-0 left-0 h-16 header z-[999]" style={{ isolation: 'isolate' }}>
      <div className="h-full flex items-center justify-between pr-6 pl-6">
        <div className="flex items-center space-x-4">
          {/* 侧边栏切换按钮 */}
          {showSidebarToggle && currentUser && onToggleSidebar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSidebar}
            >
              <PanelsLeftBottom className="h-4 w-4" />
            </Button>
          )}
          
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer space-x-4 link-logo roll event-on"
            onClick={() => router.push("/")}
            onMouseEnter={handleMouseEnter}
            onAnimationEnd={handleAnimationEnd}
          >
            <span className="translate">
              <span>
                <h1 className="logo text-2xl font-bold">
                  <GradientText
                    text="SmartCut"
                    startPercentage={30}
                    endPercentage={70}
                  />
                </h1>
              </span>
              <span>
                <h1 className="logo text-2xl font-bold">
                  <GradientText
                    text="SmartCut"
                    startPercentage={30}
                    endPercentage={70}
                  />
                </h1>
              </span>
            </span>
            {/* Beta标签 */}
            <div className="relative transform translate-y-[-1px]">
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[rgb(212 202 202)] border border-[rgba(106,244,249,0.2)] rounded-full shadow-[0_0_10px_rgba(106,244,249,0.1)]">
                Beta
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Pricing Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://pre.pi.huiying.video/pricing', '_blank')}
            className="text-gray-300 hover:text-white"
          >
            Pricing
          </Button>

          {/* User Menu */}
          <div className="relative" style={{ isolation: 'isolate' }}>
            <Button
              ref={buttonRef}
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              data-alt="user-menu-trigger"
            >
              <User className="h-4 w-4" />
            </Button>

            {mounted && isOpen && currentUser ? ReactDOM.createPortal(
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'fixed',
                  top: '4rem',
                  right: '1rem',
                  width: '18rem',
                  zIndex: 9999
                }}
                className="bg-[#1E1E1E] rounded-lg shadow-lg overflow-hidden"
                data-alt="user-menu-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                {/* User Info */}
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-[#1E4D3E] flex items-center justify-center text-white font-semibold">
                      {currentUser.avatar ? (
                        <img 
                          src={currentUser.avatar} 
                          alt={currentUser.name} 
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className='flex-1'>
                      <p className="text-sm font-medium text-white">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>
                    <div
                      className='cursor-pointer hover:text-red-400 transition-colors duration-200 text-gray-400'
                      onClick={() => {
                        logoutUser();
                        setIsOpen(false);
                      }}
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* AI Points */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-white underline text-sm">100 credits</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white/10 rounded-full px-8"
                    onClick={() => {
                      window.open('https://pre.pi.huiying.video/pricing', '_blank');
                      setIsOpen(false);
                    }}
                  >
                    Upgrade
                  </Button>
                </div>

                {/* Footer */}
                <div className="p-2">
                  <div className="mt-2 px-3 py-2 text-xs text-gray-400 text-center border-t border-gray-700">
                    <div>Privacy Policy · Terms of Service</div>
                    <div className="mt-1">© 2025 MovieFlow</div>
                  </div>
                </div>
              </motion.div>
            , document.body) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
