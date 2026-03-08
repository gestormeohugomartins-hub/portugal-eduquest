

## Plan: Reformular Subscrições Premium e Dashboard de Associações

### Current State
- Single price hardcoded (`price_1T8gBJRwhbKQXE0Jo3VJxe8t`) in `create-checkout`
- No `subscription_type` column on `students`
- No premium 15% bonus multiplier implemented anywhere
- No association dashboard page (only `/register/association`)
- Association donation is a flat 1EUR, not 10%
- `check-subscription` doesn't return plan type

### What Changes

#### 1. Create Stripe Products & Prices
- **Monthly**: "Questeduca Premium Mensal" - 1.99 EUR/month recurring
- **Annual**: "Questeduca Premium Anual" - 21.49 EUR/year recurring (12 x 1.99 x 0.90 = 21.49)

#### 2. Database Migration
```sql
-- Add subscription_type and premium_bonus_applied to students
ALTER TABLE students ADD COLUMN subscription_type text DEFAULT null; -- 'monthly' | 'annual' | null
ALTER TABLE students ADD COLUMN premium_bonus_applied boolean DEFAULT false;
ALTER TABLE students ADD COLUMN annual_bonus_building text DEFAULT null;
```

#### 3. Update `create-checkout` Edge Function
- Accept `plan` parameter ('monthly' | 'annual')
- Use the correct Stripe price ID based on plan
- Store `plan` in session metadata
- Calculate 10% association commission (not flat 1EUR)

#### 4. Update `check-subscription` Edge Function
- Return `subscription_type` ('monthly'/'annual') based on price ID
- Update `students.subscription_type` in DB
- On first activation with `premium_bonus_applied = false`:
  - Add 15% to terrain/materials
  - Set `premium_bonus_applied = true`
- For annual subscriptions, handle the free essential building bonus

#### 5. Redesign `PremiumModal.tsx`
- Monthly/Annual toggle with pricing display
- Monthly: 1.99 EUR/month
- Annual: 21.49 EUR/year (show "poupa 10%" badge)
- Association donation text updated to "10% da subscrição"
- Annual plan highlights: free essential building bonus
- For active premium users: show plan type and manage subscription

#### 6. Implement 15% Premium Multiplier
- In `QuizModal.tsx`: multiply coin/XP/diamond rewards by 1.15 when `is_premium`
- In `useResources.ts`: multiply gathered amounts by 1.15 when premium
- In `BattleModal.tsx`: multiply battle rewards by 1.15

#### 7. Annual Bonus: Free Essential Building
- After annual subscription activation, show a modal asking which essential building they want (Hospital, Câmara Municipal, Escola, Quartel de Bombeiros)
- If they already have all, ask which to upgrade +2 levels
- Store choice in `annual_bonus_building`

#### 8. Create Association Dashboard Page (`/association`)
- Login-protected route for association accounts (matched by email on `parent_associations`)
- Display:
  - Association code
  - Total monthly subscribers count
  - Total annual subscribers count
  - Total revenue raised (`total_raised`)
  - Total paid out (`total_paid`)
  - Real-time auto-refresh
- Data sourced from `association_donations` table + `parent_associations`

#### 9. Update Association Revenue Logic
- In `create-checkout` or via webhook-less approach in `check-subscription`:
  - When subscription renews, record 10% of payment as donation
  - Monthly: 0.199 EUR per renewal
  - Annual: 2.149 EUR per renewal
- Payment rules remain: at 100 EUR or end of school year

### Files to Create/Modify
- `supabase/functions/create-checkout/index.ts` -- dual plan support
- `supabase/functions/check-subscription/index.ts` -- return plan type, apply bonuses
- `src/components/game/PremiumModal.tsx` -- full redesign with toggle
- `src/components/game/AnnualBonusModal.tsx` -- new: essential building choice
- `src/components/game/QuizModal.tsx` -- 1.15x multiplier
- `src/hooks/useResources.ts` -- 1.15x gathering multiplier
- `src/pages/AssociationDashboard.tsx` -- new page
- `src/App.tsx` -- add `/association` route
- DB migration: add columns to students

### Implementation Order
1. Create Stripe monthly + annual prices (tool calls)
2. Run DB migration
3. Update edge functions (create-checkout, check-subscription)
4. Redesign PremiumModal with plan toggle
5. Add 15% multiplier to quiz rewards and resource gathering
6. Create AnnualBonusModal for free building
7. Create AssociationDashboard page + route

