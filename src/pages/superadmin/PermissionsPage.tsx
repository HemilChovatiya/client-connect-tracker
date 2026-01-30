import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

type AppRole = 'superadmin' | 'admin' | 'manager' | 'collector';

interface Permission {
  id?: string;
  customer_id: string;
  role: AppRole;
  module_id: string;
  can_view: boolean;
  can_add: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_print: boolean;
}

interface Module {
  id: string;
  name: string;
  code: string;
}

interface Customer {
  id: string;
  name: string;
  code: string;
}

const ROLES: AppRole[] = ['admin', 'manager', 'collector'];

export const PermissionsPage = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');
  const [localPermissions, setLocalPermissions] = useState<Record<string, Permission>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Customer[];
    },
  });

  const { data: modules } = useQuery({
    queryKey: ['modules-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, code')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as Module[];
    },
  });

  const { data: permissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions', selectedCustomer, selectedRole],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('customer_id', selectedCustomer)
        .eq('role', selectedRole);

      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!selectedCustomer,
  });

  useEffect(() => {
    if (modules && permissions) {
      const permMap: Record<string, Permission> = {};
      
      modules.forEach((module) => {
        const existing = permissions.find((p) => p.module_id === module.id);
        permMap[module.id] = existing || {
          customer_id: selectedCustomer,
          role: selectedRole,
          module_id: module.id,
          can_view: false,
          can_add: false,
          can_update: false,
          can_delete: false,
          can_print: false,
        };
      });
      
      setLocalPermissions(permMap);
      setHasChanges(false);
    }
  }, [modules, permissions, selectedCustomer, selectedRole]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const permissionsToSave = Object.values(localPermissions);
      
      for (const perm of permissionsToSave) {
        if (perm.id) {
          const { error } = await supabase
            .from('permissions')
            .update({
              can_view: perm.can_view,
              can_add: perm.can_add,
              can_update: perm.can_update,
              can_delete: perm.can_delete,
              can_print: perm.can_print,
            })
            .eq('id', perm.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('permissions').insert({
            customer_id: perm.customer_id,
            role: perm.role,
            module_id: perm.module_id,
            can_view: perm.can_view,
            can_add: perm.can_add,
            can_update: perm.can_update,
            can_delete: perm.can_delete,
            can_print: perm.can_print,
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({ title: 'Permissions saved successfully' });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving permissions', description: error.message, variant: 'destructive' });
    },
  });

  const handlePermissionChange = (
    moduleId: string,
    field: 'can_view' | 'can_add' | 'can_update' | 'can_delete' | 'can_print',
    value: boolean
  ) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSelectAll = (field: 'can_view' | 'can_add' | 'can_update' | 'can_delete' | 'can_print') => {
    const allChecked = modules?.every((m) => localPermissions[m.id]?.[field]);
    
    setLocalPermissions((prev) => {
      const updated = { ...prev };
      modules?.forEach((module) => {
        if (updated[module.id]) {
          updated[module.id] = {
            ...updated[module.id],
            [field]: !allChecked,
          };
        }
      });
      return updated;
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Permissions</h2>
          <p className="text-muted-foreground">Configure module-wise permissions per customer and role</p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Permissions
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="w-64">
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.code} - {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedCustomer && (
        <div className="text-center py-12 text-muted-foreground">
          Select a customer to manage permissions
        </div>
      )}

      {selectedCustomer && loadingPermissions && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {selectedCustomer && !loadingPermissions && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>View</span>
                    <Checkbox
                      checked={modules?.every((m) => localPermissions[m.id]?.can_view)}
                      onCheckedChange={() => handleSelectAll('can_view')}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>Add</span>
                    <Checkbox
                      checked={modules?.every((m) => localPermissions[m.id]?.can_add)}
                      onCheckedChange={() => handleSelectAll('can_add')}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>Update</span>
                    <Checkbox
                      checked={modules?.every((m) => localPermissions[m.id]?.can_update)}
                      onCheckedChange={() => handleSelectAll('can_update')}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>Delete</span>
                    <Checkbox
                      checked={modules?.every((m) => localPermissions[m.id]?.can_delete)}
                      onCheckedChange={() => handleSelectAll('can_delete')}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>Print</span>
                    <Checkbox
                      checked={modules?.every((m) => localPermissions[m.id]?.can_print)}
                      onCheckedChange={() => handleSelectAll('can_print')}
                    />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules?.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={localPermissions[module.id]?.can_view || false}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(module.id, 'can_view', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={localPermissions[module.id]?.can_add || false}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(module.id, 'can_add', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={localPermissions[module.id]?.can_update || false}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(module.id, 'can_update', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={localPermissions[module.id]?.can_delete || false}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(module.id, 'can_delete', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={localPermissions[module.id]?.can_print || false}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(module.id, 'can_print', checked as boolean)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
