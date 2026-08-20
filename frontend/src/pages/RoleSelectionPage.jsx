import React, { useState } from 'react';
import {Stethoscope, User} from 'lucide-react';
import { useAuth} from '../context/AuthContext';

export default function RoleSelectionPage({onNavigate}) {
    const {setRole} = useAuth();
    const [selectedRole, setSelectedRoleState]= useState('patient');

    const handleRoleSelection = (roleId) => {
        setSelectedRoleState(roleId);
        setRole(roleId);
        setTimeout (() =>{
            onNavigate('signup');
        } , 200);
        };

        const roles =[
            {
                id: 'patient',
                label: 'Patient',
                desc: 'Store medical history, track lab trends, and view AI health insights.',
                icon: (
                    <div className="relative">
                        <User className="w-6 h-16 text-black" />
                        <div className="absolute -bottom-1 -right-1 bg-black text-white p-1.5 rounded-full">
                            <span className="text-xs font-bold">+</span>
                        </div>
                    </div>
                )
            },
            {
                id:'doctor',
                label: 'Doctor',
                desc:'Review assigned patient vaults, sign AI extractions, and issue prescriptions.',
                icon:(
                    <div className="relative">
                        <Stethoscope className="w-16 h-16 text-black" />
                        </div>
                )
            }
        ];

       return (
    <div className="min-h-screen bg-cream-grid flex items-center justify-center p-6 select-none">
      <div className="max-w-3xl w-full bg-white rounded-3xl p-10 md:p-14 border border-[#E5E0D5] shadow-vault-lg flex flex-col items-center relative">
        
        {/* Top Logo Badge Header */}
        <div className="w-full flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            +
          </div>
          <span className="font-extrabold text-xl tracking-tight text-black">
            VaultCare <span className="text-[#C9A574]">AI</span>
          </span>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center max-w-lg mb-10 space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#333333] tracking-tight">
            AI-Powered Personal Health Record Platform
          </h1>
          <p className="text-base text-[#777777] font-medium">
            Select your role to continue
          </p>
        </div>

        {/* 2 Role Cards Row (Doctor & Patient only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => handleRoleSelection(r.id)}
                className={`bg-white rounded-2xl p-8 border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-vault-card hover:shadow-xl hover:-translate-y-1 ${
                  isSelected 
                    ? 'border-black ring-2 ring-black/10 scale-105' 
                    : 'border-[#E5E0D5] hover:border-black/40'
                }`}
              >
                <div className="mb-6 flex items-center justify-center h-20">
                  {r.icon}
                </div>
                <h3 className="text-xl font-black text-black mb-1">
                  {r.label}
                </h3>
                <p className="text-xs text-[#777777] font-medium">
                  {r.desc}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#888888] font-medium">
          Select Doctor or Patient to proceed to account registration
        </p>
      </div>
    </div>
  );
}
