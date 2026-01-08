import { MOCK_CHURCHES, MOCK_MEMBERS, MOCK_MINISTRIES, MOCK_SCHEDULES, MOCK_SCHEDULE_ASSIGNMENTS, MOCK_SCHEDULE_RESPONSES, MOCK_SCHEDULE_TEMPLATES, MOCK_USER, MOCK_PROFILES, MOCK_USER_ROLES } from "./mockData";

// In-memory storage instead of localStorage to keep it "clean" and avoid persistence errors
let MOCK_DB = {
    churches: JSON.parse(JSON.stringify(MOCK_CHURCHES)),
    members: JSON.parse(JSON.stringify(MOCK_MEMBERS)),
    ministries: JSON.parse(JSON.stringify(MOCK_MINISTRIES)),
    schedules: JSON.parse(JSON.stringify(MOCK_SCHEDULES)),
    schedule_assignments: JSON.parse(JSON.stringify(MOCK_SCHEDULE_ASSIGNMENTS)),
    schedule_responses: JSON.parse(JSON.stringify(MOCK_SCHEDULE_RESPONSES)),
    schedule_templates: JSON.parse(JSON.stringify(MOCK_SCHEDULE_TEMPLATES)),
    profiles: JSON.parse(JSON.stringify(MOCK_PROFILES)),
    user_roles: JSON.parse(JSON.stringify(MOCK_USER_ROLES)),
};

const authListeners: ((event: string, session: any) => void)[] = [];

// Ensure SESSION_STATE is defined BEFORE getLoggedUser
let SESSION_STATE = {
    isLoggedIn: false,
    userEmail: null as string | null
};

const getLoggedUser = () => {
    if (!SESSION_STATE.isLoggedIn) return null;
    const email = SESSION_STATE.userEmail || "demonstracao@escalaministerial.com.br";
    return {
        ...MOCK_USER,
        id: "user-1", // Mantemos o ID fixo para conectar com os dados mockados
        email: email,
        user_metadata: {
            full_name: email.split('@')[0].toUpperCase(),
        }
    };
};

const notifyAuthChange = (event: string) => {
    const user = getLoggedUser();
    const session = user ? { user, access_token: "mock-token", expires_in: 3600, refresh_token: "mock-refresh" } : null;
    console.log(`Mock notifyAuthChange: ${event}`, { session });
    authListeners.forEach(callback => callback(event, session));
};

class MockQueryBuilder {
    private table: string;
    private data: any[];
    private count: number | null = null;
    private filters: ((item: any) => boolean)[] = [];
    private updateValues: any = null;
    private isDelete: boolean = false;
    private isInsert: boolean = false;
    private insertValues: any = null;

    constructor(table: string) {
        this.table = table;
        this.data = [...(MOCK_DB as any)[table] || []];
    }

    select(query: string = "*", options?: { count?: string, head?: boolean }) {
        if (options?.count) {
            this.count = this.data.length;
        }
        if (options?.head) {
            this.data = [];
        }
        return this;
    }

    eq(column: string, value: any) {
        if (value === null || value === undefined) return this;
        this.filters.push(item => item[column] === value);
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push(item => item[column] !== value);
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push(item => item[column] >= value);
        return this;
    }

    match(query: any) {
        Object.keys(query).forEach(key => {
            this.eq(key, query[key]);
        });
        return this;
    }

    order(column: string, options: { ascending: boolean } = { ascending: true }) {
        // Simple sort, will be applied in applyFiltersAndSort
        return this;
    }

    limit(count: number) {
        // Will be applied at the end
        return this;
    }

    single() {
        return this.then((res: any) => {
            if (res.error) return res;
            if (!res.data || res.data.length === 0) {
                return { data: null, error: { code: 'PGRST116', message: "No rows found" }, count: 0 };
            }
            return { data: res.data[0], error: null, count: res.count };
        });
    }

    maybeSingle() {
        return this.then((res: any) => {
            if (res.error) return res;
            return { data: res.data ? res.data[0] : null, error: null, count: res.count };
        });
    }

    private applyOperations() {
        let currentData = [...(MOCK_DB as any)[this.table] || []];

        // Se for inserção, ignoramos filtros (geralmente insert não tem filtros)
        if (this.isInsert) {
            const itemsToInsert = Array.isArray(this.insertValues) ? this.insertValues : [this.insertValues];
            const newItems = itemsToInsert.map(item => ({
                id: item.id || Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                ...item
            }));
            (MOCK_DB as any)[this.table] = [...(MOCK_DB as any)[this.table], ...newItems];
            return newItems;
        }

        // Para os outros, aplicamos filtros primeiro
        let filteredIndices: number[] = [];
        currentData.forEach((item, index) => {
            if (this.filters.every(filter => filter(item))) {
                filteredIndices.push(index);
            }
        });

        if (this.isDelete) {
            const deletedItems = filteredIndices.map(i => currentData[i]);
            (MOCK_DB as any)[this.table] = currentData.filter((_, i) => !filteredIndices.includes(i));
            return deletedItems; // Supabase delete usually returns the deleted items if select() is used
        }

        if (this.updateValues) {
            const updatedItems: any[] = [];
            filteredIndices.forEach(index => {
                const updated = {
                    ...currentData[index],
                    ...this.updateValues,
                    updated_at: new Date().toISOString()
                };
                currentData[index] = updated;
                updatedItems.push(updated);
            });
            (MOCK_DB as any)[this.table] = currentData;
            return updatedItems;
        }

        // Apenas select
        return filteredIndices.map(i => currentData[i]);
    }

    async then(resolve: any) {
        const results = this.applyOperations();

        // Enriquecer dados (joins simulados)
        let enrichedData = results.map(item => {
            const newItem = { ...item };

            if (this.table === 'members' && item.ministry_id) {
                const ministry = MOCK_DB.ministries.find((m: any) => m.id === item.ministry_id);
                if (ministry) {
                    newItem.ministries = { name: ministry.name };
                }
            }

            if (this.table === 'schedule_assignments' && item.member_id) {
                const member = MOCK_DB.members.find((m: any) => m.id === item.member_id);
                if (member) {
                    newItem.members = { ...member };
                }
            }

            if (this.table === 'schedule_assignments' && item.schedule_id) {
                const schedule = MOCK_DB.schedules.find((s: any) => s.id === item.schedule_id);
                if (schedule) {
                    newItem.schedules = { ...schedule };
                }
            }

            return newItem;
        });

        const response = { data: enrichedData, error: null, count: this.count };
        if (typeof resolve === 'function') {
            return resolve(response);
        }
        return response;
    }

    insert(values: any) {
        this.isInsert = true;
        this.insertValues = values;
        return this;
    }

    update(values: any) {
        this.updateValues = values;
        return this;
    }

    delete() {
        this.isDelete = true;
        return this;
    }

    async upsert(values: any) {
        const itemsToUpsert = Array.isArray(values) ? values : [values];
        itemsToUpsert.forEach(newItem => {
            const index = (MOCK_DB as any)[this.table].findIndex((item: any) =>
                (newItem.id && item.id === newItem.id) ||
                (newItem.email && item.email === newItem.email)
            );

            if (index !== -1) {
                (MOCK_DB as any)[this.table][index] = {
                    ...(MOCK_DB as any)[this.table][index],
                    ...newItem,
                    updated_at: new Date().toISOString()
                };
            } else {
                (MOCK_DB as any)[this.table].push({
                    id: newItem.id || Math.random().toString(36).substr(2, 9),
                    created_at: new Date().toISOString(),
                    ...newItem
                });
            }
        });
        return { data: itemsToUpsert, error: null };
    }
}

export const mockSupabase = {
    auth: {
        getSession: () => {
            const user = getLoggedUser();
            console.log("Mock getSession", { user });
            return Promise.resolve({
                data: { session: user ? { user, access_token: "mock-token", expires_in: 3600 } : null },
                error: null
            });
        },
        getUser: () => {
            const user = getLoggedUser();
            console.log("Mock getUser", { user });
            return Promise.resolve({ data: { user }, error: null });
        },
        signInWithPassword: ({ email }: { email: string }) => {
            console.log("Mock signInWithPassword", { email });
            SESSION_STATE.isLoggedIn = true;
            SESSION_STATE.userEmail = email;
            const user = getLoggedUser();
            const session = { user, access_token: "mock-token", expires_in: 3600 };
            notifyAuthChange("SIGNED_IN");
            return Promise.resolve({ data: { user, session }, error: null });
        },
        signOut: () => {
            console.log("Mock signOut");
            SESSION_STATE.isLoggedIn = false;
            SESSION_STATE.userEmail = null;
            notifyAuthChange("SIGNED_OUT");
            return Promise.resolve({ error: null });
        },
        onAuthStateChange: (callback: any) => {
            console.log("Mock onAuthStateChange registered");
            authListeners.push(callback);
            const user = getLoggedUser();
            const session = user ? { user, access_token: "mock-token", expires_in: 3600 } : null;
            // Send initial state
            setTimeout(() => {
                callback("INITIAL_SESSION", session);
            }, 0);
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {
                            console.log("Mock onAuthStateChange unregistered");
                            const index = authListeners.indexOf(callback);
                            if (index !== -1) authListeners.splice(index, 1);
                        }
                    }
                }
            };
        }
    },
    from: (table: string) => {
        console.log(`Mock from: ${table}`);
        return new MockQueryBuilder(table);
    },
    rpc: (fn: string, args: any) => {
        console.log(`Mock rpc: ${fn}`, args);
        if (fn === 'has_role') {
            // Se o email contiver 'admin', damos acesso total
            const user = getLoggedUser();
            const isAdmin = user?.email?.includes('admin');

            if (args?._role === 'platform_admin') return Promise.resolve({ data: isAdmin, error: null });
            return Promise.resolve({ data: true, error: null });
        }
        if (fn === 'get_user_church_id') {
            return Promise.resolve({ data: "church-1", error: null });
        }
        return Promise.resolve({ data: null, error: null });
    },
    functions: {
        invoke: (name: string, options: any) => {
            console.log(`Mock function invoke: ${name}`, options);
            return Promise.resolve({ data: { message: "Success (Mock)" }, error: null });
        }
    }
};
