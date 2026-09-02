"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Copy, Check } from "lucide-react";

import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiError } from "@/lib/api";
import type { EventDetail } from "@/lib/types/event";
import type { CreateRegistrationPayload, RegistrationResult, SubOptionSelection } from "@/lib/types/registration";
import CustomFieldRenderer from "@/components/registration/CustomFieldRenderer";
import SubOptionPicker from "@/components/registration/SubOptionPicker";
import AccommodationSection, { AccommodationValue } from "@/components/registration/AccommodationSection";
import UpiPaymentSection from "@/components/registration/UpiPaymentSection";
import { useSitePaymentSettings } from "@/lib/site-settings";

import styles from "./register.module.css";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type IdentityType = "COLLEGE_ID" | "AADHAR" | "PAN" | "DRIVING_LICENSE" | "PASSPORT" | "VOTER_ID";

const IDENTITY_TYPES: { value: IdentityType; label: string }[] = [
    { value: "COLLEGE_ID", label: "College ID" },
    { value: "AADHAR", label: "Aadhar" },
    { value: "PAN", label: "PAN" },
    { value: "DRIVING_LICENSE", label: "Driving Licence" },
    { value: "PASSPORT", label: "Passport" },
    { value: "VOTER_ID", label: "Voter ID" },
];

type Step = "team" | "details" | "payment";

const STEP_LABELS: Record<Step, string> = {
    team: "Team",
    details: "Details",
    payment: "Payment",
};

function StepIndicator({ steps, current }: { steps: Step[]; current: Step }) {
    const currentIndex = steps.indexOf(current);
    return (
        <div className={styles.steps}>
            {steps.map((step, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                return (
                    <React.Fragment key={step}>
                        {i > 0 && (
                            <div className={done || active ? styles.stepConnectorDone : styles.stepConnector} />
                        )}
                        <div className={styles.step}>
                            <span
                                className={
                                    active ? styles.stepNumberActive : done ? styles.stepNumberDone : styles.stepNumber
                                }
                            >
                                {i + 1}
                            </span>
                            <span className={active ? styles.stepLabelActive : styles.stepLabel}>
                                {STEP_LABELS[step]}
                            </span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

interface TeamRef {
    id: string;
    inviteCode: string;
}

function validateRosterFile(file: File | null): string | undefined {
    if (!file) return "Required";
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Only JPG, PNG, or WEBP accepted";
    if (file.size > MAX_FILE_BYTES) return "Must be under 5 MB";
    return undefined;
}

export default function RegisterPage() {
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();
    const paymentSettings = useSitePaymentSettings();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [step, setStep] = useState<Step>("team");
    const [team, setTeam] = useState<TeamRef | null>(null);
    const [teamAction, setTeamAction] = useState<"create" | "join">(
        searchParams.get("inviteCode") ? "join" : "create",
    );
    const [joinedNotCaptain, setJoinedNotCaptain] = useState(false);

    const [genderDeclared, setGenderDeclared] = useState<"MEN" | "WOMEN" | "">("");
    const [customData, setCustomData] = useState<Record<string, unknown>>({});
    const [subOptionSelections, setSubOptionSelections] = useState<SubOptionSelection[]>([]);
    const [accommodation, setAccommodation] = useState<AccommodationValue>({});
    const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registration, setRegistration] = useState<RegistrationResult | null>(null);

    const fetchEvent = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const res = await api.get(`/events/${params.slug}`);
            const data = res.data as EventDetail;
            setEvent(data);
            if (data.registrationType === "INDIVIDUAL") {
                setStep("details");
            }
        } catch (err) {
            console.error("Failed to load event", err);
            setLoadError(err instanceof Error ? err.message : "Failed to load event.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.slug]);

    if (isLoading) {
        return <SectionSpinner message="Loading..." />;
    }

    if (loadError || !event) {
        return <ErrorState description={loadError ?? "Event not found."} onRetry={fetchEvent} />;
    }

    const isTeamEvent = event.registrationType === "TEAM";
    const steps: Step[] = isTeamEvent ? ["team", "details", "payment"] : ["details", "payment"];

    const handleSubmitRegistration = async () => {
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            const payload: CreateRegistrationPayload = {
                eventId: event.id,
                teamId: isTeamEvent ? team?.id : undefined,
                genderDeclared:
                    event.feeStructure === "GENDER_BASED" && genderDeclared ? genderDeclared : undefined,
                customData: Object.keys(customData).length > 0 ? customData : undefined,
                subOptionSelections: subOptionSelections.length > 0 ? subOptionSelections : undefined,
                ...accommodation,
                agreedToGuidelines,
            };
            const res = await api.post("/registrations", payload);
            setRegistration(res.data as RegistrationResult);
            setStep("payment");
        } catch (err) {
            if (err instanceof ApiError) {
                setSubmitError(err.message);
            } else {
                setSubmitError("Failed to submit registration. Please try again.");
            }
            console.error("Registration submit failed", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <h1 className={styles.title}>Register — {event.name}</h1>

                <StepIndicator steps={steps} current={step} />

                {step === "team" && isTeamEvent && (
                    <TeamStep
                        event={event}
                        teamAction={teamAction}
                        setTeamAction={setTeamAction}
                        initialInviteCode={searchParams.get("inviteCode") ?? ""}
                        onTeamCreated={(t) => {
                            setTeam(t);
                        }}
                        onJoined={() => setJoinedNotCaptain(true)}
                        joinedNotCaptain={joinedNotCaptain}
                        onContinue={() => setStep("details")}
                        canContinue={team != null}
                    />
                )}

                {step === "details" && (
                    <div className={styles.detailsForm}>
                        {event.feeStructure === "GENDER_BASED" && (
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="genderDeclared">
                                    Category
                                </label>
                                <select
                                    id="genderDeclared"
                                    className={styles.select}
                                    value={genderDeclared}
                                    onChange={(e) => setGenderDeclared(e.target.value as "MEN" | "WOMEN")}
                                >
                                    <option value="" disabled>
                                        Select a category
                                    </option>
                                    <option value="MEN">Men</option>
                                    <option value="WOMEN">Women</option>
                                </select>
                            </div>
                        )}

                        {event.hasAccommodation && (
                            <AccommodationSection
                                isTeamEvent={isTeamEvent}
                                value={accommodation}
                                onChange={setAccommodation}
                            />
                        )}

                        <SubOptionPicker
                            subOptions={event.subOptions}
                            selections={subOptionSelections}
                            onChange={setSubOptionSelections}
                        />

                        <CustomFieldRenderer
                            fields={event.customFieldsDef ?? []}
                            values={customData}
                            onChange={(label, value) =>
                                setCustomData((prev) => ({ ...prev, [label]: value }))
                            }
                        />

                        <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={agreedToGuidelines}
                                onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                            />
                            I have read and agree to the{" "}
                            <a href="/registration-guidelines" target="_blank" rel="noopener noreferrer">
                                Registration Guidelines
                            </a>
                        </label>

                        {submitError && <p className={styles.errorText}>{submitError}</p>}

                        <Button
                            variant="primary"
                            size="lg"
                            loading={isSubmitting}
                            disabled={!agreedToGuidelines}
                            onClick={handleSubmitRegistration}
                        >
                            Submit Registration
                        </Button>
                    </div>
                )}

                {step === "payment" && registration && (
                    <UpiPaymentSection
                        amountDue={Number(registration.payment.amount)}
                        registrationId={registration.id}
                        isIITP={Number(registration.payment.amount) === 0}
                        vpa={paymentSettings.vpa}
                        payeeName={paymentSettings.payeeName}
                        qrImageUrl={paymentSettings.qrImageUrl}
                    />
                )}
            </Card>
        </div>
    );
}

interface TeamStepProps {
    event: EventDetail;
    teamAction: "create" | "join";
    setTeamAction: (a: "create" | "join") => void;
    initialInviteCode: string;
    onTeamCreated: (team: TeamRef) => void;
    onJoined: () => void;
    joinedNotCaptain: boolean;
    onContinue: () => void;
    canContinue: boolean;
}

function TeamStep({
    event,
    teamAction,
    setTeamAction,
    initialInviteCode,
    onTeamCreated,
    onJoined,
    joinedNotCaptain,
    onContinue,
    canContinue,
}: TeamStepProps) {
    const [createdTeam, setCreatedTeam] = useState<TeamRef | null>(null);
    const [copied, setCopied] = useState(false);

    const joinLink = createdTeam
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/events/${event.slug}/register?inviteCode=${createdTeam.inviteCode}`
        : "";

    const copyJoinLink = async () => {
        try {
            await navigator.clipboard.writeText(joinLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API unavailable — link stays selectable as text.
        }
    };

    if (createdTeam) {
        return (
            <div className={styles.teamCreatedPanel}>
                <p className={styles.successText}>Team created.</p>
                <p className={styles.hintText}>
                    Share this link with your teammates so they can join. Registration doesn&apos;t need to
                    wait for them — you can continue now.
                </p>
                <div className={styles.linkRow}>
                    <span className={styles.linkValue}>{joinLink}</span>
                    <button type="button" className={styles.copyBtn} onClick={copyJoinLink}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
                <Button variant="primary" size="lg" onClick={onContinue}>
                    Continue
                </Button>
            </div>
        );
    }

    if (joinedNotCaptain) {
        return (
            <div className={styles.teamCreatedPanel}>
                <p className={styles.successText}>You&apos;ve joined the team.</p>
                <p className={styles.hintText}>
                    Only the team captain can complete registration and payment for this event — ask your
                    captain to finish registering the team.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className={styles.tabRow}>
                <button
                    type="button"
                    className={teamAction === "create" ? styles.tabActive : styles.tab}
                    onClick={() => setTeamAction("create")}
                >
                    Create Team
                </button>
                <button
                    type="button"
                    className={teamAction === "join" ? styles.tabActive : styles.tab}
                    onClick={() => setTeamAction("join")}
                >
                    Join Team
                </button>
            </div>

            {teamAction === "create" ? (
                <CreateTeamForm
                    event={event}
                    onCreated={(t) => {
                        setCreatedTeam(t);
                        onTeamCreated(t);
                    }}
                />
            ) : (
                <JoinTeamForm
                    initialInviteCode={initialInviteCode}
                    onJoined={onJoined}
                />
            )}

            {canContinue && (
                <Button variant="primary" size="lg" onClick={onContinue} className={styles.continueBtn}>
                    Continue
                </Button>
            )}
        </div>
    );
}

function CreateTeamForm({ event, onCreated }: { event: EventDetail; onCreated: (team: TeamRef) => void }) {
    const [name, setName] = useState("");
    const [collegeName, setCollegeName] = useState("");
    const [collegeAddress, setCollegeAddress] = useState("");
    const [isIITP, setIsIITP] = useState(false);
    const [viceCaptainName, setViceCaptainName] = useState("");
    const [viceCaptainPhone, setViceCaptainPhone] = useState("");
    const [coachName, setCoachName] = useState("");
    const [coachPhone, setCoachPhone] = useState("");
    const [declaredSize, setDeclaredSize] = useState("");
    const [idType, setIdType] = useState<IdentityType>("COLLEGE_ID");
    const [idNumber, setIdNumber] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [idFile, setIdFile] = useState<File | null>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const sizeHint =
        event.teamSizeMin != null && event.teamSizeMax != null
            ? `Between ${event.teamSizeMin} and ${event.teamSizeMax}`
            : undefined;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: Record<string, string> = {};
        const size = Number(declaredSize);
        if (!declaredSize || Number.isNaN(size) || size < 1) {
            nextErrors.declaredSize = "Required";
        } else if (event.teamSizeMin != null && size < event.teamSizeMin) {
            nextErrors.declaredSize = `Must be at least ${event.teamSizeMin}`;
        } else if (event.teamSizeMax != null && size > event.teamSizeMax) {
            nextErrors.declaredSize = `Must be at most ${event.teamSizeMax}`;
        }
        if (!name.trim()) nextErrors.name = "Required";
        if (!collegeName.trim()) nextErrors.collegeName = "Required";
        if (!idNumber.trim()) nextErrors.idNumber = "Required";
        const photoError = validateRosterFile(photo);
        if (photoError) nextErrors.photo = photoError;
        const idFileError = validateRosterFile(idFile);
        if (idFileError) nextErrors.idFile = idFileError;

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        setApiError(null);
        try {
            const formData = new FormData();
            formData.append("eventId", event.id);
            formData.append("declaredSize", declaredSize);
            formData.append("name", name.trim());
            formData.append("collegeName", collegeName.trim());
            if (collegeAddress.trim()) formData.append("collegeAddress", collegeAddress.trim());
            formData.append("isIITP", String(isIITP));
            if (viceCaptainName.trim()) formData.append("viceCaptainName", viceCaptainName.trim());
            if (viceCaptainPhone.trim()) formData.append("viceCaptainPhone", viceCaptainPhone.trim());
            if (coachName.trim()) formData.append("coachName", coachName.trim());
            if (coachPhone.trim()) formData.append("coachPhone", coachPhone.trim());
            formData.append("idType", idType);
            formData.append("idNumber", idNumber.trim());
            formData.append("photo", photo as File);
            formData.append("idFile", idFile as File);

            const res = await api.post("/teams", formData);
            const data = res.data as { team: { id: string; inviteCode: string } };
            onCreated({ id: data.team.id, inviteCode: data.team.inviteCode });
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : "Failed to create team.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <Input
                id="name"
                label="Team name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
            />
            <Input
                id="collegeName"
                label="College name *"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                error={errors.collegeName}
            />
            <Input
                id="collegeAddress"
                label="College address"
                value={collegeAddress}
                onChange={(e) => setCollegeAddress(e.target.value)}
            />
            <label className={styles.checkboxRow}>
                <input type="checkbox" checked={isIITP} onChange={(e) => setIsIITP(e.target.checked)} />
                IITP team (fee-waived)
            </label>

            {event.teamSizeMin != null && (
                <Input
                    id="declaredSize"
                    label="Declared team size *"
                    type="number"
                    min={event.teamSizeMin ?? 1}
                    max={event.teamSizeMax ?? undefined}
                    hint={sizeHint}
                    value={declaredSize}
                    onChange={(e) => setDeclaredSize(e.target.value)}
                    error={errors.declaredSize}
                />
            )}

            {event.viceCaptainRequired && (
                <>
                    <Input
                        id="viceCaptainName"
                        label="Vice-captain name"
                        value={viceCaptainName}
                        onChange={(e) => setViceCaptainName(e.target.value)}
                    />
                    <Input
                        id="viceCaptainPhone"
                        label="Vice-captain phone"
                        value={viceCaptainPhone}
                        onChange={(e) => setViceCaptainPhone(e.target.value)}
                    />
                </>
            )}

            {event.coachAllowed && (
                <>
                    <Input
                        id="coachName"
                        label="Coach name"
                        value={coachName}
                        onChange={(e) => setCoachName(e.target.value)}
                    />
                    <Input
                        id="coachPhone"
                        label="Coach phone"
                        value={coachPhone}
                        onChange={(e) => setCoachPhone(e.target.value)}
                    />
                </>
            )}

            <div className={styles.field}>
                <label className={styles.label} htmlFor="idType">
                    Your ID type *
                </label>
                <select
                    id="idType"
                    className={styles.select}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as IdentityType)}
                >
                    {IDENTITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </div>
            <Input
                id="idNumber"
                label="Your ID number *"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                error={errors.idNumber}
            />

            <RosterFileInput
                label="Your photo *"
                file={photo}
                onChange={setPhoto}
                error={errors.photo}
            />
            <RosterFileInput
                label="Your ID document *"
                file={idFile}
                onChange={setIdFile}
                error={errors.idFile}
            />

            {apiError && <p className={styles.errorText}>{apiError}</p>}

            <Button type="submit" variant="primary" size="lg" loading={submitting}>
                Create Team
            </Button>
        </form>
    );
}

function JoinTeamForm({
    initialInviteCode,
    onJoined,
}: {
    initialInviteCode: string;
    onJoined: () => void;
}) {
    const [inviteCode, setInviteCode] = useState(initialInviteCode);
    const [idType, setIdType] = useState<IdentityType>("COLLEGE_ID");
    const [idNumber, setIdNumber] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [idFile, setIdFile] = useState<File | null>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: Record<string, string> = {};
        if (!inviteCode.trim()) nextErrors.inviteCode = "Required";
        if (!idNumber.trim()) nextErrors.idNumber = "Required";
        const photoError = validateRosterFile(photo);
        if (photoError) nextErrors.photo = photoError;
        const idFileError = validateRosterFile(idFile);
        if (idFileError) nextErrors.idFile = idFileError;

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        setApiError(null);
        try {
            const formData = new FormData();
            formData.append("inviteCode", inviteCode.trim());
            formData.append("idType", idType);
            formData.append("idNumber", idNumber.trim());
            formData.append("photo", photo as File);
            formData.append("idFile", idFile as File);

            await api.post(`/teams/join`, formData);
            onJoined();
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : "Failed to join team.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <Input
                id="join-inviteCode"
                label="Invite code *"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                error={errors.inviteCode}
                hint="Ask your captain for the join link or invite code"
            />

            <div className={styles.field}>
                <label className={styles.label} htmlFor="join-idType">
                    Your ID type *
                </label>
                <select
                    id="join-idType"
                    className={styles.select}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as IdentityType)}
                >
                    {IDENTITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </div>
            <Input
                id="join-idNumber"
                label="Your ID number *"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                error={errors.idNumber}
            />

            <RosterFileInput label="Your photo *" file={photo} onChange={setPhoto} error={errors.photo} />
            <RosterFileInput
                label="Your ID document *"
                file={idFile}
                onChange={setIdFile}
                error={errors.idFile}
            />

            {apiError && <p className={styles.errorText}>{apiError}</p>}

            <Button type="submit" variant="primary" size="lg" loading={submitting}>
                Join Team
            </Button>
        </form>
    );
}

function RosterFileInput({
    label,
    file,
    onChange,
    error,
}: {
    label: string;
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}) {
    const id = `file-${label.replace(/\s+/g, "-")}`;
    return (
        <div className={styles.field}>
            <label className={styles.label} htmlFor={id}>
                {label}
            </label>
            <label className={styles.fileDropzone} htmlFor={id}>
                {file ? file.name : "Choose file (JPG, PNG, WEBP, max 5 MB)"}
            </label>
            <input
                id={id}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.hiddenFileInput}
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}
