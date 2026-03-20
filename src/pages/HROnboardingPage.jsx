import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Loader2, PlusCircle, RefreshCw } from 'lucide-react';

const HROnboardingPage = () => {
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [activeCases, setActiveCases] = useState([]);

    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        tasks: [{ title: '', description: '', requires_document: false }]
    });

    const [assignForm, setAssignForm] = useState({ employee_id: '', template_id: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [templatesData, employeesData, casesData] = await Promise.all([
                api.get('/onboarding/templates'),
                api.get('/employees'),
                api.get('/onboarding/cases/active')
            ]);
            setTemplates(templatesData || []);
            setEmployees(employeesData || []);
            setActiveCases(casesData || []);
        } catch (error) {
            console.error('Failed to fetch onboarding data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addTaskRow = () => {
        setTemplateForm((prev) => ({
            ...prev,
            tasks: [...prev.tasks, { title: '', description: '', requires_document: false }]
        }));
    };

    const removeTaskRow = (idx) => {
        setTemplateForm((prev) => ({
            ...prev,
            tasks: prev.tasks.filter((_, i) => i !== idx)
        }));
    };

    const updateTask = (idx, patch) => {
        setTemplateForm((prev) => ({
            ...prev,
            tasks: prev.tasks.map((task, i) => (i === idx ? { ...task, ...patch } : task))
        }));
    };

    const createTemplate = async (e) => {
        e.preventDefault();
        try {
            const cleanedTasks = templateForm.tasks.filter((t) => t.title.trim());
            await api.post('/onboarding/templates', { ...templateForm, tasks: cleanedTasks });
            setTemplateForm({ name: '', description: '', tasks: [{ title: '', description: '', requires_document: false }] });
            await fetchData();
        } catch (error) {
            console.error('Create template failed', error);
            alert('Failed to create template');
        }
    };

    const assignTemplate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/onboarding/assign', assignForm);
            setAssignForm({ employee_id: '', template_id: '' });
            await fetchData();
        } catch (error) {
            console.error('Assign template failed', error);
            alert(error.message || 'Failed to assign onboarding template');
        }
    };

    const updateTaskStatusByHR = async (taskId, is_completed) => {
        try {
            await api.patch(`/onboarding/tasks/${taskId}/hr`, { is_completed });
            setActiveCases((prev) => prev.map((item) => {
                const updatedTasks = item.tasks.map((task) => task.id === taskId ? { ...task, is_completed } : task);
                const done = updatedTasks.filter((t) => t.is_completed).length;
                const total = updatedTasks.length;
                const completion_percentage = total === 0 ? 0 : Math.round((done * 100) / total);
                return { ...item, tasks: updatedTasks, completed_tasks: done, total_tasks: total, completion_percentage };
            }));
        } catch (error) {
            console.error('Failed to update task status', error);
            alert('Task update failed');
        }
    };

    const employeeOptions = useMemo(() => employees.map((e) => ({ id: e.id, name: e.full_name })), [employees]);

    return (
        <>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '26px', color: 'var(--text-main)', fontWeight: '700' }}>Employee Onboarding</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Manage templates, assign onboarding, and monitor case completion.</p>
                </div>
                <button className="btn-primary" onClick={fetchData} style={{ borderRadius: '10px' }}>
                    <RefreshCw size={18} /> Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '70px' }}>
                    <Loader2 size={36} className="animate-spin" color="var(--primary)" />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    <div className="card" style={{ padding: '18px' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Create Onboarding Template</h3>
                        <form onSubmit={createTemplate} style={{ display: 'grid', gap: '10px' }}>
                            <input className="input-field" placeholder="Template name" value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} required />
                            <textarea className="input-field" rows="2" placeholder="Description" value={templateForm.description} onChange={(e) => setTemplateForm((p) => ({ ...p, description: e.target.value }))} />

                            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Template Tasks</p>
                                {templateForm.tasks.map((task, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '8px', marginBottom: '8px' }}>
                                        <input className="input-field" placeholder="Task title" value={task.title} onChange={(e) => updateTask(idx, { title: e.target.value })} />
                                        <input className="input-field" placeholder="Task description" value={task.description} onChange={(e) => updateTask(idx, { description: e.target.value })} />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <input type="checkbox" checked={task.requires_document} onChange={(e) => updateTask(idx, { requires_document: e.target.checked })} /> Requires doc
                                        </label>
                                        <button type="button" onClick={() => removeTaskRow(idx)} style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer' }}>Remove</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addTaskRow} style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}>+ Add task</button>
                            </div>

                            <button type="submit" className="btn-primary" style={{ borderRadius: '8px' }}>
                                <PlusCircle size={16} /> Create Template
                            </button>
                        </form>
                    </div>

                    <div className="card" style={{ padding: '18px' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Assign Template to Employee</h3>
                        <form onSubmit={assignTemplate} style={{ display: 'grid', gap: '10px' }}>
                            <select className="input-field" value={assignForm.employee_id} onChange={(e) => setAssignForm((p) => ({ ...p, employee_id: e.target.value }))} required>
                                <option value="">Select employee</option>
                                {employeeOptions.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>

                            <select className="input-field" value={assignForm.template_id} onChange={(e) => setAssignForm((p) => ({ ...p, template_id: e.target.value }))} required>
                                <option value="">Select template</option>
                                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>

                            <button type="submit" className="btn-primary" style={{ borderRadius: '8px' }}>Assign</button>
                        </form>

                        <div style={{ marginTop: '14px' }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Available Templates</p>
                            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                                {templates.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No templates yet.</p>
                                ) : templates.map((t) => (
                                    <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
                                        <p style={{ fontWeight: '700', fontSize: '13px' }}>{t.name}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t.task_count || 0} tasks</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: '18px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Active Onboarding Cases</h3>
                {activeCases.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No active onboarding cases.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {activeCases.map((item) => (
                            <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div>
                                        <p style={{ fontWeight: '700' }}>{item.employee_name}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.template_name}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '700' }}>{item.completion_percentage}%</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.completed_tasks}/{item.total_tasks} tasks</p>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                                    <div style={{ width: `${item.completion_percentage}%`, height: '100%', background: 'var(--primary)' }} />
                                </div>

                                <div style={{ display: 'grid', gap: '6px' }}>
                                    {(item.tasks || []).map((task) => (
                                        <label key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '8px', background: '#F8FAFC' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <input type="checkbox" checked={task.is_completed} onChange={(e) => updateTaskStatusByHR(task.id, e.target.checked)} />
                                                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{task.title}</span>
                                                </div>
                                                {task.requires_document && <span style={{ fontSize: '11px', color: '#0369A1' }}>Document required</span>}
                                            </div>
                                            {task.document_url && (
                                                <a href={task.document_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--primary)' }}>View doc</a>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default HROnboardingPage;
