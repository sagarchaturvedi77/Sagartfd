import React from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Mail, MessageCircle, ArrowUpRight } from "lucide-react";

// Generic (not per-task-authored) 4-step workflow guide showing how a real
// client-facing job actually plays out — do the work, send it to the
// client, handle whatever they come back with (a question, a correction
// request, or just approval), then submit. Shown on every non-interactive-
// tool task so TFD Mailbox/Connect feel like part of the job, not a
// side feature — matches the "guide ho ki us task ko kese pura krna h"
// request without needing 34 bespoke playbooks authored per task.
export default function TaskPlaybook({ taskId }) {
    const navigate = useNavigate();
    const mailboxPath = taskId ? `/portal/student/mailbox?task_id=${taskId}` : "/portal/student/mailbox";
    const steps = [
        { title: "Do the work", body: "Complete the task below — your sheet, write-up, or tool submission." },
        { title: "Send it to the client", body: "Open TFD Mailbox and email your finished work/summary to your track's client contact.", action: { label: "Open Mailbox", icon: Mail, path: mailboxPath } },
        { title: "Handle their response", body: "They might approve it, ask a question, or request a correction — check Mailbox, or keep it live on TFD Connect.", action: { label: "Open Connect", icon: MessageCircle, path: "/portal/student/connect" } },
        { title: "Submit your final task", body: "Once anything they raised is addressed, come back here and submit for grading." },
    ];

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-white/80 mb-3">
                <ListChecks size={13} className="text-[#14E0A0]" /> Suggested Workflow
            </p>
            <div className="space-y-2.5">
                {steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#14E0A0]/15 text-[#14E0A0] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white/85">{s.title}</p>
                            <p className="text-[11px] text-white/45 leading-relaxed mt-0.5">{s.body}</p>
                            {s.action && (
                                <button
                                    onClick={() => navigate(s.action.path)}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-[#14E0A0] hover:text-[#0FCB8F] mt-1"
                                >
                                    <s.action.icon size={11} /> {s.action.label} <ArrowUpRight size={11} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
