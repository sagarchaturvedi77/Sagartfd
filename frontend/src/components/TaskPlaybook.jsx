import React from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Mail, MessageCircle, BookOpen, ArrowUpRight, PenSquare, CheckCircle2 } from "lucide-react";

// Per-task guided workflow — renders the task's own authored `playbook`
// (see backend seed_internship_tasks.py TASK_PLAYBOOKS) so every task reads
// like a real corporate assignment: study → do the work → email the NAMED
// client → handle their reply → submit. Each action deep-links straight
// into the right tool, and the Mailbox step pre-fills the exact recipient +
// subject via query params (StudentMailbox reads them). Falls back to a
// generic 4-step guide for any legacy task that has no playbook yet.
const GENERIC_STEPS = [
    { title: "Do the work", detail: "Complete the task below — your sheet, write-up, or tool submission." },
    { title: "Send it to the client", detail: "Open TFD Mailbox and email your finished work to your track's client contact.", action: { type: "mailbox", label: "Open Mailbox" } },
    { title: "Handle their response", detail: "They might approve it, ask a question, or request a correction — check Mailbox or keep it live on TFD Connect.", action: { type: "connect", label: "Open Connect" } },
    { title: "Submit your final task", detail: "Once anything they raised is addressed, come back here and submit for grading.", action: { type: "submit", label: "Submit below" } },
];

const ACTION_ICON = { study: BookOpen, mailbox: Mail, connect: MessageCircle, tool: PenSquare, submit: CheckCircle2 };

export default function TaskPlaybook({ task, taskId: taskIdProp }) {
    const navigate = useNavigate();
    const taskId = task?.id || taskIdProp;
    const steps = task?.playbook?.length ? task.playbook : GENERIC_STEPS;

    const runAction = (action) => {
        if (!action) return;
        if (action.type === "study") {
            navigate("/portal/student/study-material");
        } else if (action.type === "mailbox") {
            const params = new URLSearchParams();
            if (taskId) params.set("task_id", taskId);
            if (action.to_email) params.set("to", action.to_email);
            if (action.subject) params.set("subject", action.subject);
            navigate(`/portal/student/mailbox${params.toString() ? `?${params}` : ""}`);
        } else if (action.type === "connect") {
            navigate("/portal/student/connect");
        } else {
            // tool / submit — the work + submit button live on this page; just scroll down.
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }
    };

    return (
        <div className="rounded-xl border border-[#14E0A0]/25 bg-[#14E0A0]/[0.05] p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                <ListChecks size={14} className="text-[#14E0A0]" /> Your Playbook — do it in this order
            </p>
            <p className="text-[11px] text-white/55 mb-3.5 leading-relaxed">
                This is a real client job. Follow each step — the buttons take you straight to the right tool with the client &amp; subject already filled in.
            </p>
            <div className="space-y-3">
                {steps.map((s, i) => {
                    const Icon = s.action ? ACTION_ICON[s.action.type] || ArrowUpRight : null;
                    return (
                        <div key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#14E0A0]/15 text-[#14E0A0] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-white/90">{s.title}</p>
                                <p className="text-[11.5px] text-white/55 leading-relaxed mt-0.5">{s.detail || s.body}</p>
                                {s.action && (
                                    <button
                                        onClick={() => runAction(s.action)}
                                        className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0a0f14] bg-[#14E0A0] hover:bg-[#0FCB8F] rounded-lg px-2.5 py-1.5 mt-2 transition-colors"
                                    >
                                        {Icon && <Icon size={12} />} {s.action.label} <ArrowUpRight size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
