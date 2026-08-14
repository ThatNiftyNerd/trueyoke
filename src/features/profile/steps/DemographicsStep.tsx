import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import {
  demographicsSchemaFor,
  emptyToNull,
  CITY_OTHER,
  FULL_NAME_MAX,
  type DemographicsValues,
} from "../schemas";
import { BLOOD_GROUPS, GENOTYPES, EDUCATION_LEVELS } from "../constants";
import { COUNTRIES, citiesForCountry, flagEmoji } from "../geo";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

function codeForCountryName(name: string): string {
  return COUNTRIES.find((c) => c.name === name)?.code ?? "";
}

export function DemographicsStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DemographicsValues>({
    resolver: zodResolver(
      demographicsSchemaFor(profile.account_type),
    ) as unknown as Resolver<DemographicsValues>,
    defaultValues: {
      full_name: profile.full_name ?? "",
      age: profile.age ?? (undefined as unknown as number),
      gender: profile.gender ?? (undefined as unknown as "male" | "female"),
      country: profile.country ?? "",
      city_choice: profile.city ?? "",
      city_other: "",
      blood_group: profile.blood_group ?? "",
      genotype: profile.genotype ?? "",
      nationality: profile.nationality ?? "",
      qualification: profile.qualification ?? "",
      occupation: profile.occupation ?? "",
    },
  });
  const gender = watch("gender");
  const country = watch("country");
  const cityChoice = watch("city_choice");
  const nationalityValue = watch("nationality");
  const hasLegacyNationality =
    !!nationalityValue && !COUNTRIES.some((c) => c.name === nationalityValue);

  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Load the city list whenever the selected country changes.
  useEffect(() => {
    const code = codeForCountryName(country ?? "");
    if (!code) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setCitiesLoading(true);
    citiesForCountry(code)
      .then((list) => {
        if (!cancelled) setCities(list);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const onCountryChange = (name: string) => {
    setValue("country", name, { shouldDirty: true });
    // Never carry a city from the previous country forward.
    setValue("city_choice", "", { shouldDirty: true });
    setValue("city_other", "", { shouldDirty: true });
  };

  const cityOptions =
    cityChoice && cityChoice !== CITY_OTHER && !cities.includes(cityChoice)
      ? [cityChoice, ...cities]
      : cities;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const { city_choice, city_other, ...rest } = values;
      const city = (city_choice === CITY_OTHER ? city_other : city_choice).trim();
      const countryName = (values.country ?? "").trim();
      const locationLabel = [city, countryName].filter(Boolean).join(", ");
      const patch = {
        ...(emptyToNull(rest) as Partial<OnboardingProfile>),
        city: city || null,
        location_label: locationLabel || null,
      } as Partial<OnboardingProfile>;
      await updateOwnProfile(patch);
      onSaved(patch);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
      <StepShell onBack={onBack} canGoBack={canGoBack} submitting={isSubmitting} error={error}>
        <Field
          label={profile.account_type === "mentor" ? "Full name" : "Full name (optional)"}
          error={errors.full_name?.message}
        >
          <Input
            placeholder="Your full legal name"
            maxLength={FULL_NAME_MAX}
            autoComplete="name"
            {...register("full_name")}
          />
        </Field>
        <Field label="Age" error={errors.age?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min={18}
            max={99}
            {...register("age", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Gender" error={errors.gender?.message}>
          <RadioGroup
            value={gender ?? ""}
            onValueChange={(v) =>
              setValue("gender", v as "male" | "female", { shouldValidate: true })
            }
            className="flex gap-6"
          >
            <label className="flex items-center gap-2 text-sm text-app-ink">
              <RadioGroupItem value="male" /> Male
            </label>
            <label className="flex items-center gap-2 text-sm text-app-ink">
              <RadioGroupItem value="female" /> Female
            </label>
          </RadioGroup>
        </Field>
        <Field label="Country">
          <Select value={country || undefined} onValueChange={onCountryChange}>
            <SelectTrigger aria-label="Country">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.name}>
                  {`${flagEmoji(c.code)} ${c.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="City">
          <Select
            value={cityChoice || undefined}
            disabled={!country || citiesLoading}
            onValueChange={(v) => setValue("city_choice", v, { shouldDirty: true })}
          >
            <SelectTrigger aria-label="City">
              <SelectValue
                placeholder={
                  !country
                    ? "Choose a country first"
                    : citiesLoading
                      ? "Loading cities…"
                      : "Select your city"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
              <SelectItem value={CITY_OTHER}>{CITY_OTHER}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {cityChoice === CITY_OTHER ? (
          <Field label="Your city" error={errors.city_other?.message}>
            <Input placeholder="Type your city" maxLength={120} {...register("city_other")} />
          </Field>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Blood group">
            <SimpleSelect
              label="Blood group"
              placeholder="Select"
              value={watch("blood_group")}
              options={BLOOD_GROUPS}
              onChange={(v) => setValue("blood_group", v, { shouldDirty: true })}
            />
          </Field>
          <Field label="Genotype">
            <SimpleSelect
              label="Genotype"
              placeholder="Select"
              value={watch("genotype")}
              options={GENOTYPES}
              onChange={(v) => setValue("genotype", v, { shouldDirty: true })}
            />
          </Field>
          <Field label="Nationality">
            <Select
              value={nationalityValue || undefined}
              onValueChange={(v) => setValue("nationality", v, { shouldDirty: true })}
            >
              <SelectTrigger aria-label="Nationality">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {hasLegacyNationality ? (
                  <SelectItem value={nationalityValue}>{nationalityValue}</SelectItem>
                ) : null}
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.name}>
                    {`${flagEmoji(c.code)} ${c.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Education">
            <SimpleSelect
              label="Education"
              placeholder="Select"
              value={watch("qualification")}
              options={EDUCATION_LEVELS}
              onChange={(v) => setValue("qualification", v, { shouldDirty: true })}
            />
          </Field>
        </div>
        <Field label="Occupation">
          <Input {...register("occupation")} />
        </Field>
      </StepShell>
    </form>
  );
}

function SimpleSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value?: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const displayOptions = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {displayOptions.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-app-ink">{label}</Label>
      {children}
      {error ? <p className="text-xs text-app-warn">{error}</p> : null}
    </div>
  );
}
