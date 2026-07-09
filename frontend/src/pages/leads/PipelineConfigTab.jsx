import React from "react";
import { Button } from "../../components/ui/button";

const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

export default function PipelineConfigTab({ pipelineStatuses, setPipelineStatuses, newStatus, setNewStatus, savePipeline }) {
  return (
    <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Pipeline Stages</h3>
      <div className="space-y-2">
        {pipelineStatuses.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC] w-6">{i + 1}.</span>
            <input
              value={s}
              onChange={(e) => { const u = [...pipelineStatuses]; u[i] = e.target.value; setPipelineStatuses(u); }}
              className={`${field} flex-1`}
            />
            <button onClick={() => setPipelineStatuses(pipelineStatuses.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newStatus} onChange={(e) => setNewStatus(e.target.value)} placeholder="New stage name" className={`${field} flex-1`} />
        <button
          onClick={() => { if (newStatus.trim()) { setPipelineStatuses([...pipelineStatuses, newStatus.trim()]); setNewStatus(""); } }}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-[#024396]/10 dark:bg-white/10 text-[#024396] dark:text-[#7CB0FF]"
        >
          Add
        </button>
      </div>
      <Button onClick={savePipeline} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">Save Pipeline</Button>
    </div>
  );
}
