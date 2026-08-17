import { FormEvent, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore';
import { Edit, Save, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { dashboard } from '@/routes';

type StudentForm = {
    firstName: string;
    lastName: string;
    email: string;
    studentNumber: string;
    course: string;
    yearLevel: string;
    phone: string;
};

type StudentRecord = StudentForm & {
    id: string;
};

const initialForm: StudentForm = {
    firstName: '',
    lastName: '',
    email: '',
    studentNumber: '',
    course: '',
    yearLevel: '',
    phone: '',
};

export default function Dashboard() {
    const [form, setForm] = useState<StudentForm>(initialForm);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        const studentsQuery = query(
            collection(db, 'students'),
            orderBy('createdAt', 'desc'),
        );

        const unsubscribe = onSnapshot(
            studentsQuery,
            (snapshot) => {
                const records = snapshot.docs.map((studentDoc) => {
                    const data = studentDoc.data() as Partial<StudentForm>;

                    return {
                        id: studentDoc.id,
                        firstName: data.firstName ?? '',
                        lastName: data.lastName ?? '',
                        email: data.email ?? '',
                        studentNumber: data.studentNumber ?? '',
                        course: data.course ?? '',
                        yearLevel: data.yearLevel ?? '',
                        phone: data.phone ?? '',
                    };
                });

                setStudents(records);
                setIsLoading(false);
            },
            (error) => {
                console.error(error);
                setSubmitError(error.message);
                setIsLoading(false);
                toast.error('Student records could not be loaded.');
            },
        );

        return unsubscribe;
    }, []);

    const updateField = (field: keyof StudentForm, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingStudentId(null);
        setSubmitError('');
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');

        const payload = {
            ...form,
            email: form.email.toLowerCase(),
        };

        try {
            if (editingStudentId) {
                await updateDoc(doc(db, 'students', editingStudentId), {
                    ...payload,
                    updatedAt: serverTimestamp(),
                });

                toast.success('Student record updated.');
            } else {
                await addDoc(collection(db, 'students'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });

                toast.success('Student saved to Firestore.');
            }

            resetForm();
        } catch (error) {
            console.error(error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown Firebase error';

            setSubmitError(message);
            toast.error('Student record could not be saved.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const editStudent = (student: StudentRecord) => {
        setForm({
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            studentNumber: student.studentNumber,
            course: student.course,
            yearLevel: student.yearLevel,
            phone: student.phone,
        });
        setEditingStudentId(student.id);
        setSubmitError('');
    };

    const deleteStudent = async (studentId: string) => {
        const shouldDelete = window.confirm('Delete this student record?');

        if (!shouldDelete) {
            return;
        }

        setSubmitError('');

        try {
            await deleteDoc(doc(db, 'students', studentId));

            if (editingStudentId === studentId) {
                resetForm();
            }

            toast.success('Student record deleted.');
        } catch (error) {
            console.error(error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown Firebase error';

            setSubmitError(message);
            toast.error('Student record could not be deleted.');
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 sm:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-normal text-foreground">
                        Student Registration
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Add, update, and delete student records in Firestore.
                    </p>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(320px,480px)_1fr]">
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-lg border border-sidebar-border/70 bg-background p-4 shadow-xs sm:p-6 dark:border-sidebar-border"
                    >
                        <div className="mb-6 flex items-center gap-3 border-b pb-4">
                            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <UserPlus className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold">
                                    {editingStudentId
                                        ? 'Update Student'
                                        : 'Student Information'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Required fields are marked with an asterisk.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                            <div className="grid gap-2">
                                <Label htmlFor="firstName">First name *</Label>
                                <Input
                                    id="firstName"
                                    value={form.firstName}
                                    onChange={(event) =>
                                        updateField(
                                            'firstName',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="lastName">Last name *</Label>
                                <Input
                                    id="lastName"
                                    value={form.lastName}
                                    onChange={(event) =>
                                        updateField(
                                            'lastName',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        updateField('email', event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="studentNumber">
                                    Student number *
                                </Label>
                                <Input
                                    id="studentNumber"
                                    value={form.studentNumber}
                                    onChange={(event) =>
                                        updateField(
                                            'studentNumber',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="course">Course *</Label>
                                <Input
                                    id="course"
                                    value={form.course}
                                    onChange={(event) =>
                                        updateField(
                                            'course',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="BS Information Technology"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="yearLevel">Year level *</Label>
                                <Select
                                    value={form.yearLevel}
                                    onValueChange={(value) =>
                                        updateField('yearLevel', value)
                                    }
                                    required
                                >
                                    <SelectTrigger
                                        id="yearLevel"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select year level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1st Year">
                                            1st Year
                                        </SelectItem>
                                        <SelectItem value="2nd Year">
                                            2nd Year
                                        </SelectItem>
                                        <SelectItem value="3rd Year">
                                            3rd Year
                                        </SelectItem>
                                        <SelectItem value="4th Year">
                                            4th Year
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2 md:col-span-2 xl:col-span-1">
                                <Label htmlFor="phone">Phone number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(event) =>
                                        updateField('phone', event.target.value)
                                    }
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            {editingStudentId ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    <X className="size-4" />
                                    Cancel
                                </Button>
                            ) : null}
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="size-4" />
                                {isSubmitting
                                    ? 'Saving...'
                                    : editingStudentId
                                      ? 'Update student'
                                      : 'Save student'}
                            </Button>
                        </div>

                        {submitError ? (
                            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {submitError}
                            </div>
                        ) : null}
                    </form>

                    <section className="rounded-lg border border-sidebar-border/70 bg-background p-4 shadow-xs sm:p-6 dark:border-sidebar-border">
                        <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
                            <div>
                                <h2 className="text-base font-semibold">
                                    Student Records
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {isLoading
                                        ? 'Loading records...'
                                        : `${students.length} ${students.length === 1 ? 'record' : 'records'}`}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="border-b text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">
                                            Name
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Student No.
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Course
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Year
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Contact
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-3 py-3">
                                                <div className="font-medium">
                                                    {student.firstName}{' '}
                                                    {student.lastName}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {student.email}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                {student.studentNumber}
                                            </td>
                                            <td className="px-3 py-3">
                                                {student.course}
                                            </td>
                                            <td className="px-3 py-3">
                                                {student.yearLevel}
                                            </td>
                                            <td className="px-3 py-3">
                                                {student.phone || 'N/A'}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            editStudent(student)
                                                        }
                                                    >
                                                        <Edit className="size-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            deleteStudent(
                                                                student.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {!isLoading && students.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-3 py-10 text-center text-muted-foreground"
                                            >
                                                No student records yet.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
