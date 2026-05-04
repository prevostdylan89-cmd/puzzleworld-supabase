import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function MobileSelect({ value, onValueChange, placeholder, children, trigger, title }) {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Extract items from children
  const items = React.Children.toArray(children).filter(
    child => child.type === SelectItem
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger || (
            <Button variant="outline" className="w-full justify-between">
              {value ? items.find(item => item.props.value === value)?.props.children : placeholder}
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="bg-[#0a0a2e] border-white/10">
          <DrawerHeader>
            <DrawerTitle className="text-white">{title || placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2">
            {items.map((item) => (
              <button
                key={item.props.value}
                onClick={() => {
                  onValueChange(item.props.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  value === item.props.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <span>{item.props.children}</span>
                {value === item.props.value && <Check className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
}