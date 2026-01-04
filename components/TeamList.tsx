
import React from 'react';
import { TeamMember } from '../types';
import { User, Signal, Mic } from 'lucide-react';

interface TeamListProps {
  members: TeamMember[];
}

export const TeamList: React.FC<TeamListProps> = ({ members }) => {
  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      <div className="p-4 border-b border-white/5 sticky top-0 bg-gray-950/95 backdrop-blur z-10 flex justify-between items-center">
        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Unidades Activas</h2>
        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 font-mono">{members.length}</span>
      </div>
      
      {members.length === 0 ? (
        <div className="p-10 text-center opacity-20 flex flex-col items-center gap-2">
          <User size={32} />
          <p className="text-[9px] uppercase font-bold tracking-widest">Sin unidades en alcance</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {members.map((member) => (
            <div key={member.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${member.status === 'talking' ? 'bg-orange-600 border-orange-400 animate-pulse text-white' : 'bg-gray-900 border-white/10 text-gray-600'}`}>
                  {member.status === 'talking' ? <Mic size={18} /> : <User size={18} />}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-200 uppercase tracking-tight">{member.name}</div>
                  <div className={`text-[10px] font-mono uppercase ${member.status === 'talking' ? 'text-orange-500' : 'text-gray-500'}`}>
                    {member.status === 'talking' ? 'TRANSMITIENDO...' : member.role}
                  </div>
                </div>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-mono text-gray-400">{member.distance}</div>
                 <div className="flex items-center justify-end gap-1 text-[8px] text-emerald-500 font-bold uppercase mt-1">
                   <Signal size={8} /> 100%
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
