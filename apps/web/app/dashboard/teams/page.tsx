"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, X } from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api, ApiError } from "@/lib/api";
import styles from "./teams.module.css";

interface MyTeam {
    id: string;
    name: string;
    declaredSize: number;
    inviteCode: string | null;
    role: "CAPTAIN" | "MEMBER";
    collegeName: string;
    collegeAddress: string | null;
    isIITP: boolean;
    viceCaptainName: string | null;
    viceCaptainPhone: string | null;
    coachName: string | null;
    coachPhone: string | null;
    event: { id: string; name: string; slug: string; teamSizeMin: number | null; teamSizeMax: number | null };
    participants: { id: string; name: string; role: string }[];
    registration: { id: string; status: string } | null;
}

export default function TeamsPage() {
    const [teams, setTeams] = useState<MyTeam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

    const fetchTeams = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/teams/mine');
            setTeams(res?.data ?? []);
        } catch (err) {
            console.error("Failed to load teams", err);
            setError(err instanceof Error ? err.message : "Failed to load your teams.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const removeMember = async (teamId: string, participantId: string, participantName: string) => {
        if (!window.confirm(`Remove ${participantName} from this team?`)) return;
        try {
            await api.delete(`/teams/${teamId}/participants/${participantId}`);
            await fetchTeams();
        } catch (err) {
            window.alert(err instanceof ApiError ? err.message : "Failed to remove team member.");
        }
    };

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Teams</h1>
                <p className={styles.subtitle}>
                    Teams you captain or have joined as a member.
                </p>
            </div>

            {isLoading ? (
                <SectionSpinner message="Loading teams..." />
            ) : error ? (
                <ErrorState description={error} onRetry={fetchTeams} />
            ) : teams.length === 0 ? (
                <EmptyState
                    title="No teams yet"
                    description="You haven't created any teams. Create one from an event's registration page."
                />
            ) : (
                <div className={styles.grid}>
                    {teams.map((team) => {
                        const joinLink =
                            typeof window !== "undefined"
                                ? `${window.location.origin}/dashboard/events/${team.event.slug}/register?inviteCode=${team.inviteCode}`
                                : "";
                        const rosterOpen = team.participants.length < team.declaredSize;
                        const isEditing = editingTeamId === team.id;

                        return (
                            <Card key={team.id} className={styles.teamCard}>
                                <div className={styles.metaRow}>
                                    <h2 className={styles.teamName}>{team.name}</h2>
                                    <Badge variant={team.role === "CAPTAIN" ? "success" : "default"}>
                                        {team.role === "CAPTAIN" ? "Captain" : "Member"}
                                    </Badge>
                                </div>
                                <span className={styles.eventName}>{team.event.name}</span>

                                <div className={styles.metaRow}>
                                    <span>{team.participants.length} / {team.declaredSize} roster spots filled</span>
                                    <Badge variant={team.registration ? "success" : "default"}>
                                        {team.registration ? team.registration.status.replace('_', ' ') : "Not registered"}
                                    </Badge>
                                </div>

                                <ul className={styles.rosterList}>
                                    {team.participants.map((p) => (
                                        <li key={p.id} className={styles.rosterItem}>
                                            <span>
                                                {p.name}
                                                {p.role === "CAPTAIN" ? " (Captain)" : ""}
                                            </span>
                                            {team.role === "CAPTAIN" && p.role !== "CAPTAIN" && (
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    aria-label={`Remove ${p.name}`}
                                                    onClick={() => removeMember(team.id, p.id, p.name)}
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                {team.role === "CAPTAIN" && team.inviteCode && rosterOpen && (
                                    <InviteLinkRow link={joinLink} />
                                )}

                                {team.role === "CAPTAIN" && (
                                    team.registration ? (
                                        <p className={styles.lockedNote}>
                                            Team details are locked — registration has already started for
                                            this team.
                                        </p>
                                    ) : isEditing ? (
                                        <EditTeamForm
                                            team={team}
                                            onCancel={() => setEditingTeamId(null)}
                                            onSaved={() => {
                                                setEditingTeamId(null);
                                                fetchTeams();
                                            }}
                                        />
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className={styles.editBtn}
                                            onClick={() => setEditingTeamId(team.id)}
                                        >
                                            Edit team details
                                        </Button>
                                    )
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function InviteLinkRow({ link }: { link: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API unavailable — link stays selectable as text.
        }
    };

    return (
        <div className={styles.linkRow}>
            <span className={styles.linkValue}>{link}</span>
            <button type="button" className={styles.copyBtn} onClick={copy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}

function EditTeamForm({
    team,
    onCancel,
    onSaved,
}: {
    team: MyTeam;
    onCancel: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(team.name);
    const [collegeName, setCollegeName] = useState(team.collegeName);
    const [collegeAddress, setCollegeAddress] = useState(team.collegeAddress ?? "");
    const [declaredSize, setDeclaredSize] = useState(String(team.declaredSize));
    const [viceCaptainName, setViceCaptainName] = useState(team.viceCaptainName ?? "");
    const [viceCaptainPhone, setViceCaptainPhone] = useState(team.viceCaptainPhone ?? "");
    const [coachName, setCoachName] = useState(team.coachName ?? "");
    const [coachPhone, setCoachPhone] = useState(team.coachPhone ?? "");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const sizeHint =
        team.event.teamSizeMin != null && team.event.teamSizeMax != null
            ? `Between ${team.event.teamSizeMin} and ${team.event.teamSizeMax}, at least ${team.participants.length} (current roster)`
            : undefined;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: Record<string, string> = {};
        const size = Number(declaredSize);
        if (!declaredSize || Number.isNaN(size) || size < 1) {
            nextErrors.declaredSize = "Required";
        } else if (team.event.teamSizeMin != null && size < team.event.teamSizeMin) {
            nextErrors.declaredSize = `Must be at least ${team.event.teamSizeMin}`;
        } else if (team.event.teamSizeMax != null && size > team.event.teamSizeMax) {
            nextErrors.declaredSize = `Must be at most ${team.event.teamSizeMax}`;
        } else if (size < team.participants.length) {
            nextErrors.declaredSize = `Cannot be less than the ${team.participants.length} member(s) already on the roster`;
        }
        if (!name.trim()) nextErrors.name = "Required";
        if (!collegeName.trim()) nextErrors.collegeName = "Required";

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        setApiError(null);
        try {
            await api.patch(`/teams/${team.id}`, {
                name: name.trim(),
                collegeName: collegeName.trim(),
                collegeAddress: collegeAddress.trim() || undefined,
                declaredSize: size,
                viceCaptainName: viceCaptainName.trim() || undefined,
                viceCaptainPhone: viceCaptainPhone.trim() || undefined,
                coachName: coachName.trim() || undefined,
                coachPhone: coachPhone.trim() || undefined,
            });
            onSaved();
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : "Failed to update team.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className={styles.editForm} onSubmit={handleSubmit}>
            <Input
                id={`name-${team.id}`}
                label="Team name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
            />
            <Input
                id={`collegeName-${team.id}`}
                label="College name *"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                error={errors.collegeName}
            />
            <Input
                id={`collegeAddress-${team.id}`}
                label="College address"
                value={collegeAddress}
                onChange={(e) => setCollegeAddress(e.target.value)}
            />
            <Input
                id={`declaredSize-${team.id}`}
                label="Declared team size *"
                type="number"
                min={team.event.teamSizeMin ?? 1}
                max={team.event.teamSizeMax ?? undefined}
                hint={sizeHint}
                value={declaredSize}
                onChange={(e) => setDeclaredSize(e.target.value)}
                error={errors.declaredSize}
            />
            <Input
                id={`viceCaptainName-${team.id}`}
                label="Vice-captain name"
                value={viceCaptainName}
                onChange={(e) => setViceCaptainName(e.target.value)}
            />
            <Input
                id={`viceCaptainPhone-${team.id}`}
                label="Vice-captain phone"
                value={viceCaptainPhone}
                onChange={(e) => setViceCaptainPhone(e.target.value)}
            />
            <Input
                id={`coachName-${team.id}`}
                label="Coach name"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
            />
            <Input
                id={`coachPhone-${team.id}`}
                label="Coach phone"
                value={coachPhone}
                onChange={(e) => setCoachPhone(e.target.value)}
            />

            {apiError && <p className={styles.errorText}>{apiError}</p>}

            <div className={styles.editFormActions}>
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                    Save changes
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
