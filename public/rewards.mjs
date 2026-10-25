// rewards.mjs — trophies (points) and the item shop. It runs in the browser.
//
// How trophies are earned (each reward can only be collected once):
//   - completing a lesson:       +1
//   - a quiz score of 80%+:      +3
//   - a quiz score of 95%+:      +2 more (+5 in total)
// Lifetime earnings are capped at 400 trophies; spending trophies does not reset the cap.
//
// How the wallet works: instead of storing a balance that could drift out of sync, the wallet
// stores *facts*, and the balance is calculated from them each time:
//   claims    — the rewards already collected, as strings like "foundations:complete" or
//               "unit-test:quiz80". A Set removes duplicates, so the same reward never pays twice;
//   purchases — how many of each shop item were bought with trophies;
//   gifted    — items received without spending trophies (from the version 1 migration);
//   used      — how many of each one-use item have been spent in quizzes;
//   equipped  — which permanent perks are switched on.
//   balance = earned (from claims) − spent (purchases × price).
//
// The wallet is saved in the browser's localStorage (see saveRewards in app.mjs), so a
// determined learner could edit it. restoreWallet() still cleans every value it loads, so a
// damaged or edited wallet cannot break the page or create negative balances.
import { courseIds } from './course.mjs';
import { pathLessons } from './path-lessons.mjs';

// MAX_TROPHIES: the lifetime earning cap.
// shopItems: everything in the shop.
//   type 'consumable' — used up once in a quiz (Clarity Token, Hint Pass, Retry Charm).
//   type 'permanent'  — bought once and kept; it can be equipped (switched on) or turned off.
//   group             — permanent perks that change the same thing (two trail styles, two
//                       colour accents); equipping one automatically turns the others off.
//   label             — the small tag shown on the shop card.
export const MAX_TROPHIES = 400;
export const shopItems = [
  { id: 'elimination-token', name: 'Clarity Token', icon: '−', cost: 3, type: 'consumable', label: 'ONE USE', description: 'Remove one incorrect option from the current quiz question without losing a point. One token per question.' },
  { id: 'hint-pass', name: 'Hint Pass', icon: '✧', cost: 5, type: 'consumable', label: 'ONE USE', description: 'Use a quiz hint without losing that question’s point. Activate before revealing a hint.' },
  { id: 'retry-charm', name: 'Retry Charm', icon: '↻', cost: 8, type: 'consumable', label: 'ONE USE', description: 'After your first wrong choice, keep the point if your very next choice is correct.' },
  { id: 'focus-lens', name: 'Focus Lens', icon: '◎', cost: 20, type: 'permanent', label: 'KEEP FOREVER', description: 'Larger lesson text, wider line spacing, and fewer decorative details.' },
  { id: 'study-timer', name: 'Study Timer', icon: '◷', cost: 25, type: 'permanent', label: 'KEEP FOREVER', description: 'Equip a ten-minute focus timer during lessons and quizzes. Pause or reset it whenever you need.' },
  { id: 'golden-trail', name: 'Golden Trail', icon: '✦', cost: 40, type: 'permanent', group: 'trail', label: 'KEEP FOREVER', description: 'A golden learning path and a gold highlight on your next lesson.' },
  { id: 'sage-theme', name: 'Sage Garden', icon: '❋', cost: 60, type: 'permanent', group: 'accent', label: 'KEEP FOREVER', description: 'Give buttons, quiz panels, and highlights a calming sage-green palette.' },
  { id: 'ocean-theme', name: 'Ocean Explorer', icon: '≈', cost: 80, type: 'permanent', group: 'accent', label: 'KEEP FOREVER', description: 'Equip ocean-blue buttons, quiz panels, and highlights throughout the app.' },
  { id: 'starfield', name: 'Starlight Map', icon: '✶', cost: 100, type: 'permanent', label: 'KEEP FOREVER', description: 'Add a field of little stars behind your winding lesson journey.' },
  { id: 'mastery-journal', name: 'Mastery Journal', icon: '▤', cost: 125, type: 'permanent', label: 'KEEP FOREVER', description: 'Unlock a study journal with recent quiz attempts, average scores, and learning milestones.' },
  { id: 'aurora-trail', name: 'Aurora Trail', icon: '⌁', cost: 150, type: 'permanent', group: 'trail', label: 'KEEP FOREVER', description: 'Equip a glowing teal-and-violet journey path and a luminous next-lesson circle.' },
  { id: 'scholar-crown', name: 'Scholar Crown', icon: '♛', cost: 200, type: 'permanent', label: 'KEEP FOREVER', description: 'Wear a scholar’s crown beside the Fairylearn brand and on your learning dashboard.' }
];
// Every lesson id that can earn a reward: the three public course modules plus every catalog
// stop written as "Level:index" (e.g. "Beginner:3"). validId() also accepts AI-invented lessons,
// whose ids look like "ai:" followed by a 36-character UUID.
// validSource() additionally accepts the unit test, which can earn quiz rewards but has no
// lesson to "complete".
const lessonIds = new Set([...courseIds, ...Object.entries(pathLessons).flatMap(([level, lessons]) => lessons.map((_, index) => `${level}:${index}`))]);
const validId = id => typeof id === 'string' && (lessonIds.has(id) || /^ai:[a-f0-9-]{36}$/.test(id));
const validSource = id => validId(id) || id === 'unit-test';
// How many trophies one claim is worth. A claim is "<id>:<kind>". We split at the LAST colon
// because catalog ids contain a colon themselves ("Beginner:3:complete" → "Beginner:3" and
// "complete"). Unknown or invalid claims are worth 0, so they are ignored.
const claimValue = claim => {
  if (typeof claim !== 'string') return 0;
  const split = claim.lastIndexOf(':');
  const id = claim.slice(0, split), kind = claim.slice(split + 1);
  if (kind === 'complete') return validId(id) ? 1 : 0;
  if (!validSource(id)) return 0;
  return kind === 'quiz80' ? 3 : kind === 'quiz95' ? 2 : 0;
};
// empty() creates a blank wallet. version 2 is the current format; anything else is migrated.
// count() accepts only safe whole numbers from 0 to 100,000 and turns anything else into 0.
const empty = () => ({ version: 2, claims: [], purchases: {}, gifted: {}, used: {}, equipped: {} });
const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 100000 ? value : 0;
// earnedTrophies: lifetime trophies earned (claims added up, capped at 400).
// trophyBalance:  trophies available to spend = earned − (purchases × price).
// itemCount:      how many of an item the learner has right now = bought + gifted − used.
// quizTrophyTier: the reward level for a quiz score — 5 trophies at 95%+, 3 at 80%+, else 0.
//   It compares score * 100 with total * 95 to stay in whole numbers and avoid rounding errors.
//   The inputs are range-checked so impossible scores earn nothing.
export const earnedTrophies = wallet => Math.min(MAX_TROPHIES, wallet.claims.reduce((total, claim) => total + claimValue(claim), 0));
export const trophyBalance = wallet => earnedTrophies(wallet) - shopItems.reduce((total, item) => total + (wallet.purchases[item.id] || 0) * item.cost, 0);
export const itemCount = (wallet, id) => Math.max(0, (wallet.purchases[id] || 0) + (wallet.gifted?.[id] || 0) - (wallet.used[id] || 0));
export const quizTrophyTier = (score, total) => Number.isInteger(total) && total > 0 && total <= 100 && Number.isInteger(score) && score >= 0 && score <= total ? (score * 100 >= total * 95 ? 5 : score * 100 >= total * 80 ? 3 : 0) : 0;

// Turns whatever was found in storage into a valid wallet.
//   - Only claims worth trophies are kept, without duplicates.
//   - Version 1 wallets are migrated: the old ":perfect" claim becomes both quiz claims, and
//     items bought under the old prices become gifts, so nobody loses anything they owned.
//   - A permanent item can be owned at most once.
//   - `used` can never exceed how many items were owned.
//   - A perk can only be equipped if the learner owns it.
export function restoreWallet(value) {
  const wallet = empty();
  if (!value || typeof value !== 'object') return wallet;
  const migrated = value.version !== 2;
  const claims = [];
  for (const claim of Array.isArray(value.claims) ? value.claims : []) {
    if (migrated && typeof claim === 'string' && claim.endsWith(':perfect')) {
      const id = claim.slice(0, -8);
      if (validSource(id)) claims.push(`${id}:quiz80`, `${id}:quiz95`);
    } else if (claimValue(claim)) claims.push(claim);
  }
  wallet.claims = [...new Set(claims)];
  for (const item of shopItems) {
    wallet.purchases[item.id] = migrated ? 0 : count(value.purchases?.[item.id]);
    wallet.gifted[item.id] = count(migrated ? value.purchases?.[item.id] : value.gifted?.[item.id]);
    if (item.type === 'permanent') {
      wallet.gifted[item.id] = Math.min(1, wallet.gifted[item.id]);
      wallet.purchases[item.id] = Math.min(1 - wallet.gifted[item.id], wallet.purchases[item.id]);
    }
    wallet.used[item.id] = item.type === 'consumable' ? Math.min(wallet.purchases[item.id] + wallet.gifted[item.id], count(value.used?.[item.id])) : 0;
    wallet.equipped[item.id] = item.type === 'permanent' && itemCount(wallet, item.id) > 0 && value.equipped?.[item.id] === true;
  }
  // If purchases cost more than the trophies earned (for example after an edited save), the
  // purchases are removed while gifts are kept. This guarantees the balance is never negative.
  if (trophyBalance(wallet) < 0) {
    wallet.purchases = {};
    for (const item of shopItems) { wallet.used[item.id] = Math.min(wallet.used[item.id], wallet.gifted[item.id]); if (!itemCount(wallet, item.id)) wallet.equipped[item.id] = false; }
  }
  return wallet;
}
// Adds claims and reports how many trophies that actually earned. A claim that was already
// collected, or that is past the lifetime cap, adds 0.
function claim(wallet, ids) {
  const updated = { ...wallet, claims: [...new Set([...wallet.claims, ...ids])] };
  return { wallet: updated, earned: earnedTrophies(updated) - earnedTrophies(wallet) };
}
// Rewards finishing a lesson (+1, once per lesson). Returns { wallet, earned }.
export function awardCompletion(wallet, id) {
  return validId(id) ? claim(wallet, [`${id}:complete`]) : { wallet, earned: 0 };
}
// Rewards a finished quiz. 80%+ adds the quiz80 claim; 95%+ adds both claims. Improving from
// 80% to 95% later therefore only adds the missing 2 trophies. Returns { wallet, earned }.
export function awardQuiz(wallet, id, score, total) {
  const tier = quizTrophyTier(score, total);
  if (!validSource(id) || !tier) return { wallet, earned: 0 };
  return claim(wallet, tier === 5 ? [`${id}:quiz80`, `${id}:quiz95`] : [`${id}:quiz80`]);
}
// Buys one item. Refuses unknown items, a second copy of a permanent item, or anything the
// learner cannot afford, with a message explaining why. Returns { wallet, item } on success.
export function buyItem(wallet, id) {
  const item = shopItems.find(item => item.id === id);
  if (!item) return { wallet, error: 'That perk is not available.' };
  if (item.type === 'permanent' && itemCount(wallet, id)) return { wallet, error: 'You already own this perk.' };
  if (trophyBalance(wallet) < item.cost) return { wallet, error: `You need ${item.cost - trophyBalance(wallet)} more trophies.` };
  return { wallet: { ...wallet, purchases: { ...wallet.purchases, [id]: (wallet.purchases[id] || 0) + 1 } }, item };
}
// Uses up one consumable item (for example a Hint Pass during a quiz).
export function consumeItem(wallet, id) {
  if (!shopItems.some(item => item.id === id && item.type === 'consumable') || !itemCount(wallet, id)) return { wallet, error: 'You don’t have this perk yet.' };
  return { wallet: { ...wallet, used: { ...wallet.used, [id]: (wallet.used[id] || 0) + 1 } } };
}
// Switches a permanent perk on or off. When it is switched on and belongs to a group, the other
// perks in that group are switched off, so only one trail or accent is active at a time.
export function toggleItem(wallet, id) {
  const item = shopItems.find(item => item.id === id && item.type === 'permanent');
  if (!item || !itemCount(wallet, id)) return wallet;
  const equipped = { ...wallet.equipped, [id]: !wallet.equipped[id] };
  if (equipped[id] && item.group) for (const other of shopItems) if (other.id !== id && other.group === item.group) equipped[other.id] = false;
  return { ...wallet, equipped };
}
