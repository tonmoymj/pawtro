'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'green' | 'red' | 'blue' | 'amber';
  delta?: number;
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'green', delta }: StatCardProps) {
  const colorMap = {
    green: {
      bg: 'bg-[#F1F8F6]',
      iconBg: 'bg-[#1D6B5F]',
      text: 'text-[#1D6B5F]',
    },
    red: {
      bg: 'bg-[#FBF4F3]',
      iconBg: 'bg-[#9E3B36]',
      text: 'text-[#9E3B36]',
    },
    blue: {
      bg: 'bg-[#F3F5FA]',
      iconBg: 'bg-[#46577F]',
      text: 'text-[#46577F]',
    },
    amber: {
      bg: 'bg-[#FDF8EF]',
      iconBg: 'bg-[#B87A29]',
      text: 'text-[#B87A29]',
    },
  }[color];

  return (
    <div className="bg-white rounded-[8px] border border-[#E1E5E2] p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-mono font-bold tracking-wider uppercase text-[#8A948F]">
          {title}
        </span>
        <div className={`w-8 h-8 ${colorMap.iconBg} rounded-[6px] flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      <div>
        <span className={`text-3xl font-bold tracking-tight ${colorMap.text}`}>{value}</span>
        {subtitle && (
          <span className="text-[12px] text-[#8A948F] ml-2">{subtitle}</span>
        )}
      </div>

      {delta !== undefined && (
        <div className="text-[11.5px]">
          <span className={delta >= 0 ? 'text-[#1D6B5F]' : 'text-[#9E3B36]'}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} আজ
          </span>
        </div>
      )}
    </div>
  );
}
