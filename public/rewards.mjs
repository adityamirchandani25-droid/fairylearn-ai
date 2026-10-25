import { courseIds } from './course.mjs';
import { pathLessons } from './path-lessons.mjs';

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
const lessonIds = new Set([...courseIds, ...Object.entries(pathLessons).flatMap(([level, lessons]) => lessons.map((_, index) => `${level}:${index}`))]);
const validId = id => typeof id === 'string' && (lessonIds.has(id) || /^ai:[a-f0-9-]{36}$/.test(id));
const validSource = id => validId(id) || id === 'unit-test';
const claimValue = claim => {
  if (typeof claim !== 'string') return 0;
  const split = claim.lastIndexOf(':');
  const id = claim.slice(0, split), kind = claim.slice(split + 1);
  if (kind === 'complete') return validId(id) ? 1 : 0;
  if (!validSource(id)) return 0;
  return kind === 'quiz80' ? 3 : kind === 'quiz95' ? 2 : 0;
};
const empty = () => ({ version: 2, claims: [], purchases: {}, gifted: {}, used: {}, equipped: {} });
const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 100000 ? value : 0;
export const earnedTrophies = wallet => Math.min(MAX_TROPHIES, wallet.claims.reduce((total, claim) => total + claimValue(claim), 0));
export const trophyBalance = wallet => earnedTrophies(wallet) - shopItems.reduce((total, item) => total + (wallet.purchases[item.id] || 0) * item.cost, 0);
export const itemCount = (wallet, id) => Math.max(0, (wallet.purchases[id] || 0) + (wallet.gifted?.[id] || 0) - (wallet.used[id] || 0));
export const quizTrophyTier = (score, total) => Number.isInteger(total) && total > 0 && total <= 100 && Number.isInteger(score) && score >= 0 && score <= total ? (score * 100 >= total * 95 ? 5 : score * 100 >= total * 80 ? 3 : 0) : 0;

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
  if (trophyBalance(wallet) < 0) {
    wallet.purchases = {};
    for (const item of shopItems) { wallet.used[item.id] = Math.min(wallet.used[item.id], wallet.gifted[item.id]); if (!itemCount(wallet, item.id)) wallet.equipped[item.id] = false; }
  }
  return wallet;
}
function claim(wallet, ids) {
  const updated = { ...wallet, claims: [...new Set([...wallet.claims, ...ids])] };
  return { wallet: updated, earned: earnedTrophies(updated) - earnedTrophies(wallet) };
}
export function awardCompletion(wallet, id) {
  return validId(id) ? claim(wallet, [`${id}:complete`]) : { wallet, earned: 0 };
}
export function awardQuiz(wallet, id, score, total) {
  const tier = quizTrophyTier(score, total);
  if (!validSource(id) || !tier) return { wallet, earned: 0 };
  return claim(wallet, tier === 5 ? [`${id}:quiz80`, `${id}:quiz95`] : [`${id}:quiz80`]);
}
export function buyItem(wallet, id) {
  const item = shopItems.find(item => item.id === id);
  if (!item) return { wallet, error: 'That perk is not available.' };
  if (item.type === 'permanent' && itemCount(wallet, id)) return { wallet, error: 'You already own this perk.' };
  if (trophyBalance(wallet) < item.cost) return { wallet, error: `You need ${item.cost - trophyBalance(wallet)} more trophies.` };
  return { wallet: { ...wallet, purchases: { ...wallet.purchases, [id]: (wallet.purchases[id] || 0) + 1 } }, item };
}
export function consumeItem(wallet, id) {
  if (!shopItems.some(item => item.id === id && item.type === 'consumable') || !itemCount(wallet, id)) return { wallet, error: 'You don’t have this perk yet.' };
  return { wallet: { ...wallet, used: { ...wallet.used, [id]: (wallet.used[id] || 0) + 1 } } };
}
export function toggleItem(wallet, id) {
  const item = shopItems.find(item => item.id === id && item.type === 'permanent');
  if (!item || !itemCount(wallet, id)) return wallet;
  const equipped = { ...wallet.equipped, [id]: !wallet.equipped[id] };
  if (equipped[id] && item.group) for (const other of shopItems) if (other.id !== id && other.group === item.group) equipped[other.id] = false;
  return { ...wallet, equipped };
}
