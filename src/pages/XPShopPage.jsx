import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StudentLayout from '../components/StudentLayout'
import api from '../utils/api'
import toast from 'react-hot-toast'
import './ChallengePage.css'

export default function XPShopPage() {
  const { student } = useAuth()
  const [spentXp, setSpentXp] = useState(0)
  const [unlockedItems, setUnlockedItems] = useState([])
  const [equippedFrame, setEquippedFrame] = useState(null)
  const [equippedTheme, setEquippedTheme] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadShop = async () => {
    try {
      const res = await api.get(`/students/${student.id}/quests`)
      setSpentXp(res.data.spent_xp || 0)
      setUnlockedItems(JSON.parse(res.data.unlocked_items || '[]'))
      setEquippedFrame(res.data.equipped_frame || null)
      setEquippedTheme(res.data.equipped_theme || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (student?.id) {
      loadShop()
    }
  }, [student])

  const xpBalance = (student?.xp_total || 0) - spentXp
  const SHOP_ITEMS = [
    { id: 'gold_glow', type: 'frame', name: 'Gold Glow Frame', desc: 'Golden pulsing glow around your avatar', icon: '✨', cost: 200 },
    { id: 'cyber_pulse', type: 'frame', name: 'Cyber Pulse Frame', desc: 'Teal energy field avatar ring', icon: '⚡', cost: 350 },
    { id: 'magic_shield', type: 'frame', name: 'Magic Shield Frame', desc: 'Violet mystic shield ring', icon: '🔮', cost: 500 },
    { id: 'gm_border', type: 'frame', name: 'Grand Master Border', desc: 'Exclusive fiery Grand Master ring', icon: '🔱', cost: 1000 },
    { id: 'orange_neon', type: 'skin', name: 'Orange Neon Skin', desc: 'Neon-orange glow on all cards', icon: '🟠', cost: 150 },
    { id: 'teal_neon', type: 'skin', name: 'Teal Neon Skin', desc: 'Teal glow on all cards', icon: '🩵', cost: 150 },
    { id: 'violet_neon', type: 'skin', name: 'Violet Neon Skin', desc: 'Purple mystical glow on all cards', icon: '💜', cost: 150 },
    { id: 'cyberpunk', type: 'theme', name: 'Cyberpunk Theme', desc: 'Dark grid overlay background', icon: '🌐', cost: 300 },
    { id: 'deep_forest', type: 'theme', name: 'Deep Forest Theme', desc: 'Soft green nature background', icon: '🌲', cost: 300 },
  ]

  return (
    <StudentLayout>
      <div className="container" style={{ padding: '0 1rem', maxWidth: '1000px', margin: '0 auto' }}>
        <section className="dash-hero animate-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="challenge-title" style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              XP Shop
            </h1>
            <p className="challenge-subtitle" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Spend your XP on avatar frames, card skins, and themes
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold)' }}>⚡ {xpBalance} XP</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available balance</div>
          </div>
        </section>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading shop items...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', paddingBottom: '3rem' }}>
            {SHOP_ITEMS.map(item => {
              const owned = unlockedItems.includes(item.id)
              const isEquipped = equippedFrame === item.id || equippedTheme === item.id
              const canAfford = xpBalance >= item.cost

              return (
                <div key={item.id} style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: owned ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                  border: isEquipped ? '1.5px solid rgba(255,122,0,0.5)' : owned ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>{item.desc}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: owned ? 'var(--success)' : canAfford ? 'var(--accent-gold)' : 'var(--error)' }}>
                      {owned ? '✓ Owned' : `⚡ ${item.cost} XP`}
                    </span>
                    {owned ? (
                      <button
                        onClick={async () => {
                          const equipType = item.type === 'frame' ? 'frame' : 'theme'
                          try {
                            await api.post(`/students/${student.id}/equip-item`, {
                              itemId: isEquipped ? 'default' : item.id,
                              type: equipType,
                            })
                            toast.success(isEquipped ? 'Item unequipped.' : `${item.name} equipped! ✨`)
                            loadShop()
                          } catch (e) {
                            toast.error('Could not equip item.')
                          }
                        }}
                        style={{
                          padding: '0.4rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: isEquipped ? '1px solid rgba(255,122,0,0.4)' : '1px solid rgba(255,255,255,0.12)',
                          background: isEquipped ? 'rgba(255,122,0,0.12)' : 'rgba(255,255,255,0.05)',
                          color: isEquipped ? 'var(--primary-bright)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {isEquipped ? '✦ Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={async () => {
                          try {
                            await api.post(`/students/${student.id}/buy-item`, { itemId: item.id, cost: item.cost })
                            toast.success(`${item.name} unlocked! 🎉`)
                            loadShop()
                          } catch (e) {
                            toast.error(e?.response?.data?.message || 'Purchase failed.')
                          }
                        }}
                        style={{
                          padding: '0.4rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: 'none',
                          background: canAfford ? 'linear-gradient(135deg,var(--primary),var(--primary-bright))' : 'rgba(255,255,255,0.04)',
                          color: canAfford ? '#fff' : 'var(--text-muted)',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          opacity: canAfford ? 1 : 0.5,
                        }}
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
