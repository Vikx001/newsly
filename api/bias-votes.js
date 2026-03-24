/**
 * GET  /api/bias-votes?articleHash=<hash>  — get community vote aggregate for an article
 * POST /api/bias-votes                      — cast or change your vote
 * Body (POST): { articleHash, vote }        — vote: "biased" | "not_biased"
 */

import { supabaseAdmin, requireAuth, setCors } from './_supabase.js'

const VALID_VOTES = ['biased', 'not_biased']

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { articleHash } = req.query
    if (!articleHash) return res.status(400).json({ error: 'articleHash required' })

    const safeHash = String(articleHash).slice(0, 64)

    // Get aggregate counts
    const { data: rows, error } = await supabaseAdmin
      .from('bias_votes')
      .select('vote, user_id')
      .eq('article_hash', safeHash)

    if (error) return res.status(500).json({ error: 'Failed to fetch votes' })

    const biased = rows.filter(r => r.vote === 'biased').length
    const notBiased = rows.filter(r => r.vote === 'not_biased').length
    const myRow = rows.find(r => r.user_id === user.id)

    return res.status(200).json({
      biased,
      notBiased,
      total: rows.length,
      myVote: myRow?.vote || null,
    })
  }

  if (req.method === 'POST') {
    const { articleHash, vote } = req.body || {}
    if (!articleHash) return res.status(400).json({ error: 'articleHash required' })
    if (!VALID_VOTES.includes(vote)) return res.status(400).json({ error: 'vote must be "biased" or "not_biased"' })

    const safeHash = String(articleHash).slice(0, 64)

    const { error } = await supabaseAdmin
      .from('bias_votes')
      .upsert(
        { article_hash: safeHash, user_id: user.id, vote },
        { onConflict: 'article_hash,user_id' }
      )

    if (error) return res.status(500).json({ error: 'Failed to save vote' })

    // Return updated aggregate
    const { data: rows } = await supabaseAdmin
      .from('bias_votes')
      .select('vote, user_id')
      .eq('article_hash', safeHash)

    const biased = (rows || []).filter(r => r.vote === 'biased').length
    const notBiased = (rows || []).filter(r => r.vote === 'not_biased').length

    return res.status(200).json({
      biased,
      notBiased,
      total: (rows || []).length,
      myVote: vote,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
