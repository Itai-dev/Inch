import type { Metadata } from 'next'
import { ApplyFunnel } from '@/components/apply/ApplyFunnel'

export const metadata: Metadata = { title: 'Become a model', alternates: { canonical: '/apply' } }

export default function ApplyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-16">
      <h1 className="text-6xl font-bold tracking-tight">Become a model</h1>
      <ApplyFunnel />
    </div>
  )
}
