import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auth as authApi, foods as foodsApi, users as usersApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { Card, ErrorBanner, Stat } from '../../components/ui/Card.jsx';
import { NumberField, SelectField, Segmented, TextField } from '../../components/ui/Field.jsx';
import { Sheet } from '../../components/ui/Sheet.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { formatNumber } from '../../lib/format.js';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' }
];

const GOAL_OPTIONS = [
  { value: 'cut', label: 'Lose fat' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'bulk', label: 'Build muscle' }
];

const SEX_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' }
];

export function SettingsScreen() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: usersApi.profile });
  const catalogQuery = useQuery({ queryKey: ['foods', 'stats'], queryFn: foodsApi.stats });

  const [form, setForm] = useState(null);

  // Seed the form once the profile arrives, and re-seed if it changes elsewhere.
  useEffect(() => {
    const profile = profileQuery.data?.profile;
    if (!profile) return;
    setForm({
      name: profile.name ?? '',
      sex: profile.sex ?? '',
      birth_date: profile.birth_date ? String(profile.birth_date).slice(0, 10) : '',
      height_cm: profile.height_cm ?? '',
      activity_level: profile.activity_level ?? 'moderate',
      goal_type: profile.goal_type ?? 'maintain',
      calorie_goal: profile.calorie_goal ?? 2000,
      protein_goal_g: profile.protein_goal_g ?? 150,
      carbs_goal_g: profile.carbs_goal_g ?? 220,
      fat_goal_g: profile.fat_goal_g ?? 65,
      water_goal_ml: profile.water_goal_ml ?? 2500,
      theme: profile.theme ?? 'dark',
      units: profile.units ?? 'metric'
    });
  }, [profileQuery.data]);

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const setField = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const saveProfile = useMutationWithRefresh({
    mutationFn: (patch) => usersApi.updateProfile(patch),
    invalidate: [['profile'], ['dashboard'], ['summary']],
    onSuccess: ({ profile }) => {
      updateUser(profile);
      toast.success('Settings saved');
    }
  });

  const recalculate = useMutationWithRefresh({
    mutationFn: usersApi.recalculateTargets,
    invalidate: [['profile'], ['dashboard'], ['summary']],
    onSuccess: ({ profile, based_on_weight_kg: basedOn }) => {
      updateUser(profile);
      toast.success(
        basedOn
          ? `Targets recalculated from your latest weight (${formatNumber(basedOn, 1)} kg)`
          : 'Targets recalculated'
      );
    }
  });

  const changePassword = useMutationWithRefresh({
    mutationFn: (payload) => authApi.changePassword(payload),
    onSuccess: () => {
      toast.info('Password changed — signing you out of all devices');
      setPasswordOpen(false);
      setTimeout(logout, 900);
    }
  });

  const deleteAccount = useMutationWithRefresh({
    mutationFn: (confirm) => usersApi.deleteAccount(confirm),
    onSuccess: () => {
      toast.info('Account deleted');
      logout();
    }
  });

  if (profileQuery.isPending || !form) {
    return (
      <Screen title="Settings" back="/more">
        <SkeletonCards count={3} height={160} />
      </Screen>
    );
  }

  if (profileQuery.error) {
    return (
      <Screen title="Settings" back="/more">
        <ErrorBanner error={profileQuery.error} />
      </Screen>
    );
  }

  function handleSave() {
    const patch = {
      name: form.name,
      activity_level: form.activity_level,
      goal_type: form.goal_type,
      calorie_goal: Number(form.calorie_goal),
      protein_goal_g: Number(form.protein_goal_g),
      carbs_goal_g: Number(form.carbs_goal_g),
      fat_goal_g: Number(form.fat_goal_g),
      water_goal_ml: Number(form.water_goal_ml),
      theme: form.theme,
      units: form.units,
      // Empty strings mean "clear this", which the API models as null.
      sex: form.sex === '' ? null : form.sex,
      birth_date: form.birth_date === '' ? null : form.birth_date,
      height_cm: form.height_cm === '' ? null : Number(form.height_cm)
    };
    saveProfile.mutate(patch);
  }

  const error = saveProfile.error;
  const fieldError = (name) => error?.fieldErrors?.[name];

  return (
    <Screen title="Settings" back="/more">
      {error && <ErrorBanner error={error} />}

      <Card title="Profile">
        <div className="stack">
          <TextField label="Name" value={form.name} onChange={update('name')} error={fieldError('name')} autoCapitalize="words" />
          <TextField label="Email" value={user?.email ?? ''} disabled hint="Contact support to change your email." />

          <div className="field-row">
            <SelectField label="Sex" options={SEX_OPTIONS} value={form.sex} onChange={update('sex')} />
            <TextField label="Date of birth" type="date" value={form.birth_date} onChange={update('birth_date')} />
          </div>

          <NumberField
            label="Height (cm)"
            step="0.1"
            value={form.height_cm}
            onChange={update('height_cm')}
            error={fieldError('height_cm')}
          />
          <SelectField
            label="Activity level"
            options={ACTIVITY_OPTIONS}
            value={form.activity_level}
            onChange={update('activity_level')}
          />
          <SelectField label="Goal" options={GOAL_OPTIONS} value={form.goal_type} onChange={update('goal_type')} />
        </div>
      </Card>

      <Card
        title="Daily targets"
        subtitle="What every summary and progress bar is measured against"
        action={
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => recalculate.mutate()}
            disabled={recalculate.isPending}
          >
            {recalculate.isPending ? <Spinner label="Recalculating" /> : 'Recalculate'}
          </button>
        }
      >
        <div className="stack">
          <div className="field-row">
            <NumberField
              label="Calories (kcal)"
              decimal={false}
              value={form.calorie_goal}
              onChange={update('calorie_goal')}
              error={fieldError('calorie_goal')}
            />
            <NumberField
              label="Water (ml)"
              decimal={false}
              value={form.water_goal_ml}
              onChange={update('water_goal_ml')}
              error={fieldError('water_goal_ml')}
            />
          </div>
          <div className="grid-3">
            <NumberField
              label="Protein (g)"
              decimal={false}
              value={form.protein_goal_g}
              onChange={update('protein_goal_g')}
              error={fieldError('protein_goal_g')}
            />
            <NumberField
              label="Carbs (g)"
              decimal={false}
              value={form.carbs_goal_g}
              onChange={update('carbs_goal_g')}
              error={fieldError('carbs_goal_g')}
            />
            <NumberField
              label="Fat (g)"
              decimal={false}
              value={form.fat_goal_g}
              onChange={update('fat_goal_g')}
              error={fieldError('fat_goal_g')}
            />
          </div>
        </div>
      </Card>

      <Card title="Appearance">
        <Segmented name="theme" label="Theme" value={form.theme} onChange={setField('theme')} options={THEME_OPTIONS} />
      </Card>

      <button type="button" className="btn btn-primary btn-block" onClick={handleSave} disabled={saveProfile.isPending}>
        {saveProfile.isPending ? <Spinner label="Saving" /> : 'Save changes'}
      </button>

      <Card title="Food catalog" subtitle="Where your nutrition numbers come from">
        {catalogQuery.data && (
          <div className="grid-2" style={{ rowGap: 14 }}>
            <Stat label="Total foods" value={formatNumber(catalogQuery.data.total)} />
            <Stat label="From USDA API" value={formatNumber(catalogQuery.data.usda)} />
            <Stat label="Reference set" value={formatNumber(catalogQuery.data.seed)} />
            <Stat label="Your own" value={formatNumber(catalogQuery.data.custom)} />
          </div>
        )}
        <p className="field-hint" style={{ marginTop: 12 }}>
          {catalogQuery.data?.usda_api_enabled
            ? 'Live lookups against USDA FoodData Central are enabled — searches that the local catalog cannot answer are fetched and cached.'
            : 'Live USDA lookups are off (no API key configured). Search uses the locally seeded USDA reference values and your own foods.'}
        </p>
      </Card>

      <Card title="Your data">
        <div className="stack">
          <p className="card-subtitle">
            Export everything this account holds — meals, workouts, weights, goals and custom foods — as a JSON file.
          </p>
          <a className="btn btn-ghost btn-block" href={usersApi.exportUrl()} download>
            Download my data
          </a>
        </div>
      </Card>

      <Card title="Account">
        <div className="stack">
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setPasswordOpen(true)}>
            Change password
          </button>
          <button type="button" className="btn btn-danger btn-block" onClick={() => setDeleteOpen(true)}>
            Delete my account
          </button>
        </div>
      </Card>

      {passwordOpen && (
        <ChangePasswordSheet
          onClose={() => setPasswordOpen(false)}
          onSubmit={(payload) => changePassword.mutate(payload)}
          submitting={changePassword.isPending}
          error={changePassword.error}
        />
      )}

      {deleteOpen && (
        <DeleteAccountSheet
          onClose={() => setDeleteOpen(false)}
          onConfirm={(confirm) => deleteAccount.mutate(confirm)}
          submitting={deleteAccount.isPending}
        />
      )}
    </Screen>
  );
}

function ChangePasswordSheet({ onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState({ current_password: '', new_password: '' });
  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  return (
    <Sheet
      open
      onClose={onClose}
      title="Change password"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !form.current_password || !form.new_password}
            onClick={() => onSubmit(form)}
          >
            {submitting ? <Spinner label="Saving" /> : 'Change password'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}
      <p className="card-subtitle">Changing your password signs you out everywhere, including this device.</p>
      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={form.current_password}
        onChange={update('current_password')}
        error={error?.fieldErrors?.current_password}
      />
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={form.new_password}
        onChange={update('new_password')}
        error={error?.fieldErrors?.new_password}
        hint="At least 8 characters, including a letter and a number."
      />
    </Sheet>
  );
}

function DeleteAccountSheet({ onClose, onConfirm, submitting }) {
  const [confirmation, setConfirmation] = useState('');

  return (
    <Sheet
      open
      onClose={onClose}
      title="Delete your account"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Keep it
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={submitting || confirmation !== 'DELETE'}
            onClick={() => onConfirm(confirmation)}
          >
            {submitting ? <Spinner label="Deleting" /> : 'Delete permanently'}
          </button>
        </>
      }
    >
      <p className="card-subtitle">
        This removes your account and everything logged against it — meals, workouts, weights, goals and custom foods.
        It cannot be undone. Export your data first if you want a copy.
      </p>
      <TextField
        label="Type DELETE to confirm"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck="false"
      />
    </Sheet>
  );
}
