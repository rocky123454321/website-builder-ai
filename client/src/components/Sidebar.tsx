import React, { useEffect, useRef, useState } from 'react'
import type { Message, Project, Version } from '../types';
import { BotIcon, EyeIcon, Loader2Icon, SendIcon, UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/configs/axios';

interface SidebarProps {
    isMenuOpen: boolean;
    project: Project,
    setProject:(project: Project)=> void;
    isGenerating: boolean;
    setIsGenerating: (isGenerating: boolean) => void;
}

function Sidebar({ isMenuOpen, project, setProject, isGenerating, setIsGenerating }: SidebarProps) {

    const messageRef = useRef<HTMLDivElement>(null)
    const [input, setInput] = useState('')
    const [localError, setLocalError] = useState('')

    const handleRollback = async (versionId: string) => {
        try {
            setIsGenerating(true)
            console.log('Rolling back to version:', versionId)
            const { data } = await api.get(`/api/project/rollback/${project.id}/${versionId}`)
            if (data) {
                const { data: projectData } = await api.get(`/api/user/project/${project.id}`)
                setProject(projectData.project)
            }
        } catch (error) {
            console.error('Rollback failed:', error)
            setLocalError('Failed to rollback version')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleRevisions = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const message = input.trim()
        setInput('')
        setIsGenerating(true)
        setLocalError('')

        try {
            console.log('Sending revision request with message:', message, 'to project:', project.id)
            const { data } = await api.post(`/api/project/revision/${project.id}`, { message })
            console.log('Revision response:', data)
            if (data.project) {
                console.log('Updating project with response data, conversation length:', data.project.conversation?.length)
                setProject(data.project)
            } else {
                console.log('No project in response, refetching...')
                const { data: projectData } = await api.get(`/api/user/project/${project.id}`)
                console.log('Refetched project conversation length:', projectData.project.conversation?.length)
                setProject(projectData.project)
            }
        } catch (error: unknown) {
            console.error('Revision failed:', error)
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            setLocalError(err.response?.data?.message || err.message || 'Failed to process revision')
            setInput(message)
        } finally {
            setIsGenerating(false)
        }
    }

    useEffect(() => {
        if (messageRef.current) {
            messageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [project.conversation?.length, isGenerating]);

    const sortedItems = [...(project.conversation || []), ...(project.versions || [])].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime()
        const timeB = new Date(b.timestamp).getTime()
        return timeA - timeB
    })

    return (
        <div className={`h-full sm:max-w-sm rounded-xl bg-gray-900 border border-gray-800 transition-all ${isMenuOpen ? 'max-sm:w-full' : 'max-sm:hidden w-full'}`}>
            <div className='flex flex-col h-full'>
                {/* Message container */}
                <div className='flex-1 overflow-y-auto no-scrollbar px-3 flex flex-col gap-4 pt-4'>
                    {sortedItems.length === 0 ? (
                        <div className='flex items-center justify-center h-full text-gray-400 text-sm'>
                            Start by describing your website
                        </div>
                    ) : (
                        <>
                            {sortedItems.map((item) => {
                                const isMessage = 'role' in item && 'content' in item && !('description' in item);

                                if (isMessage) {
                                    const msg = item as Message;
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                            {!isUser && (
                                                <div className='w-8 h-8 rounded-full bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shrink-0'>
                                                    <BotIcon className='size-5 text-white' />
                                                </div>
                                            )}
                                            <div className={`max-w-[80%] p-2 px-4 rounded-2xl shadow-sm leading-relaxed ${isUser ? 'bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-tr-none' : 'rounded-tl-none bg-gray-800 text-gray-100'}`}>
                                                {msg.content}
                                            </div>
                                            {isUser && (
                                                <div className='w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0'>
                                                    <UserIcon className='size-5 text-gray-200' />
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else {
                                    const ver = item as Version;
                                    return (
                                        <div key={ver.id} className='w-4/5 mx-auto my-2 p-3 rounded-xl bg-gray-800 text-gray-100 shadow flex flex-col gap-2'>
                                            <div className='text-xs font-medium'>
                                                code updated <br /> <span className='text-gray-500 text-xs font-normal'>
                                                    {new Date(ver.timestamp).toLocaleString()}</span>
                                            </div>
                                            <div className='flex items-center justify-between gap-2'>
                                                {project.current_version_index === ver.id ? (
                                                    <button className='px-3 py-1 rounded-md text-xs bg-gray-700 whitespace-nowrap'>Current</button>
                                                ) : (
                                                    <button onClick={() => handleRollback(ver.id)} disabled={isGenerating} className='px-3 py-1 rounded-md text-xs bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 whitespace-nowrap'>
                                                        Rollback
                                                    </button>
                                                )}
                                                <Link target='_blank' to={`/preview/${project.id}/${ver.id}`}>
                                                    <EyeIcon className='size-5 p-0.5 bg-gray-700 hover:bg-indigo-500 transition-colors rounded' />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </>
                    )}
                    {isGenerating && (
                        <div className='flex items-start gap-3 justify-start'>
                            <div className='w-8 h-8 rounded-full bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shrink-0'>
                                <BotIcon className='size-5 text-white' />
                            </div>
                            <div className='flex gap-1.5 h-full items-end'>
                                <span className='size-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0s' }} />
                                <span className='size-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }} />
                                <span className='size-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messageRef} />
                </div>
                {/* INPUT AREA */}
                {localError && (
                    <div className='px-3 py-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-200'>
                        {localError}
                    </div>
                )}
                <form onSubmit={handleRevisions} className='mt-3 relative mb-2 px-3'>
                    <div className='flex items-end gap-2'>
                        <textarea
                            name='message'
                            onChange={(e) => {
                                setInput(e.target.value)
                                setLocalError('')
                            }}
                            value={input}
                            rows={3}
                            placeholder='Describe changes or new features...'
                            className='flex-1 p-3 rounded-xl resize-none text-sm outline-none ring ring-gray-700 focus:ring-indigo-500 bg-gray-800 text-gray-100 placeholder:text-gray-400 transition-all'
                            disabled={isGenerating}
                            aria-label='Describe your website or request changes'
                        />
                        <button
                            type='submit'
                            disabled={isGenerating || !input.trim()}
                            className='rounded-full bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed p-2.5 shrink-0'
                            aria-label={isGenerating ? 'Processing' : 'Send message'}
                        >
                            {isGenerating ? (
                                <Loader2Icon className='size-5 animate-spin text-white' />
                            ) : (
                                <SendIcon className='size-5 text-white' />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default Sidebar