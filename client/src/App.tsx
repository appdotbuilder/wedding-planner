
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Heart, Gift, Users, CheckCircle, DollarSign, Calendar as CalendarLarge, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { 
  Wedding, 
  Task, 
  BudgetItem, 
  Guest,
  CreateWeddingInput,
  CreateTaskInput,
  CreateBudgetItemInput,
  CreateGuestInput,
  UpdateTaskInput,
  UpdateBudgetItemInput,
  UpdateGuestRsvpInput
} from '../../server/src/schema';

function App() {
  // Main state
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWedding, setSelectedWedding] = useState<Wedding | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [weddingForm, setWeddingForm] = useState<CreateWeddingInput>({
    title: '',
    bride_name: '',
    groom_name: '',
    wedding_date: new Date(),
    venue: null,
    description: null,
    total_budget: 0
  });

  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    wedding_id: 0,
    title: '',
    description: null,
    due_date: null,
    priority: 'medium',
    category: null
  });

  const [budgetForm, setBudgetForm] = useState<CreateBudgetItemInput>({
    wedding_id: 0,
    category: '',
    item_name: '',
    estimated_cost: 0,
    actual_cost: null,
    paid: false,
    vendor: null,
    notes: null
  });

  const [guestForm, setGuestForm] = useState<CreateGuestInput>({
    wedding_id: 0,
    name: '',
    email: null,
    phone: null,
    address: null,
    plus_one: false,
    dietary_restrictions: null,
    table_number: null
  });

  // Load initial data
  const loadWeddings = useCallback(async () => {
    try {
      const result = await trpc.getWeddings.query();
      setWeddings(result);
      if (result.length > 0 && !selectedWedding) {
        setSelectedWedding(result[0]);
      }
    } catch (error) {
      console.error('Failed to load weddings:', error);
    }
  }, [selectedWedding]);

  const loadWeddingData = useCallback(async (weddingId: number) => {
    try {
      const [taskResults, budgetResults, guestResults] = await Promise.all([
        trpc.getWeddingTasks.query({ wedding_id: weddingId }),
        trpc.getWeddingBudget.query({ wedding_id: weddingId }),
        trpc.getWeddingGuests.query({ wedding_id: weddingId })
      ]);
      setTasks(taskResults);
      setBudgetItems(budgetResults);
      setGuests(guestResults);
    } catch (error) {
      console.error('Failed to load wedding data:', error);
    }
  }, []);

  useEffect(() => {
    loadWeddings();
  }, [loadWeddings]);

  useEffect(() => {
    if (selectedWedding) {
      loadWeddingData(selectedWedding.id);
    }
  }, [selectedWedding, loadWeddingData]);

  // Wedding creation
  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createWedding.mutate(weddingForm);
      setWeddings((prev: Wedding[]) => [...prev, result]);
      setSelectedWedding(result);
      setWeddingForm({
        title: '',
        bride_name: '',
        groom_name: '',
        wedding_date: new Date(),
        venue: null,
        description: null,
        total_budget: 0
      });
    } catch (error) {
      console.error('Failed to create wedding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Task management
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWedding) return;

    setIsLoading(true);
    try {
      const taskData = { ...taskForm, wedding_id: selectedWedding.id };
      const result = await trpc.createTask.mutate(taskData);
      setTasks((prev: Task[]) => [...prev, result]);
      setTaskForm({
        wedding_id: selectedWedding.id,
        title: '',
        description: null,
        due_date: null,
        priority: 'medium',
        category: null
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number, completed: boolean) => {
    try {
      const updateData: UpdateTaskInput = { id: taskId, completed };
      await trpc.updateTask.mutate(updateData);
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => 
          task.id === taskId ? { ...task, completed } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Budget management
  const handleCreateBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWedding) return;

    setIsLoading(true);
    try {
      const budgetData = { ...budgetForm, wedding_id: selectedWedding.id };
      const result = await trpc.createBudgetItem.mutate(budgetData);
      setBudgetItems((prev: BudgetItem[]) => [...prev, result]);
      setBudgetForm({
        wedding_id: selectedWedding.id,
        category: '',
        item_name: '',
        estimated_cost: 0,
        actual_cost: null,
        paid: false,
        vendor: null,
        notes: null
      });
    } catch (error) {
      console.error('Failed to create budget item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePaid = async (itemId: number, paid: boolean) => {
    try {
      const updateData: UpdateBudgetItemInput = { id: itemId, paid };
      await trpc.updateBudgetItem.mutate(updateData);
      setBudgetItems((prev: BudgetItem[]) => 
        prev.map((item: BudgetItem) => 
          item.id === itemId ? { ...item, paid } : item
        )
      );
    } catch (error) {
      console.error('Failed to update budget item:', error);
    }
  };

  // Guest management
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWedding) return;

    setIsLoading(true);
    try {
      const guestData = { ...guestForm, wedding_id: selectedWedding.id };
      const result = await trpc.createGuest.mutate(guestData);
      setGuests((prev: Guest[]) => [...prev, result]);
      setGuestForm({
        wedding_id: selectedWedding.id,
        name: '',
        email: null,
        phone: null,
        address: null,
        plus_one: false,
        dietary_restrictions: null,
        table_number: null
      });
    } catch (error) {
      console.error('Failed to create guest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRsvp = async (guestId: number, rsvp_status: 'pending' | 'attending' | 'not_attending') => {
    try {
      const updateData: UpdateGuestRsvpInput = { id: guestId, rsvp_status };
      await trpc.updateGuestRsvp.mutate(updateData);
      setGuests((prev: Guest[]) => 
        prev.map((guest: Guest) => 
          guest.id === guestId ? { ...guest, rsvp_status } : guest
        )
      );
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  // Calculate statistics
  const completedTasks = tasks.filter((task: Task) => task.completed).length;
  const totalBudget = budgetItems.reduce((sum: number, item: BudgetItem) => sum + item.estimated_cost, 0);
  const spentBudget = budgetItems
    .filter((item: BudgetItem) => item.paid)
    .reduce((sum: number, item: BudgetItem) => sum + (item.actual_cost || item.estimated_cost), 0);
  const attendingGuests = guests.filter((guest: Guest) => guest.rsvp_status === 'attending').length;

  if (weddings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">💕 Wedding Planner</h1>
            <p className="text-xl text-gray-600">Plan your perfect day with ease</p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-pink-600">Create Your Wedding Plan</CardTitle>
              <CardDescription>
                Start planning your special day! Enter your wedding details below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWedding} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bride">Bride's Name</Label>
                    <Input
                      id="bride"
                      placeholder="Bride's name"
                      value={weddingForm.bride_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setWeddingForm((prev: CreateWeddingInput) => ({ ...prev, bride_name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="groom">Groom's Name</Label>
                    <Input
                      id="groom"
                      placeholder="Groom's name"
                      value={weddingForm.groom_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setWeddingForm((prev: CreateWeddingInput) => ({ ...prev, groom_name: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Wedding Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Sarah & John's Wedding"
                    value={weddingForm.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWeddingForm((prev: CreateWeddingInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Wedding Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !weddingForm.wedding_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {weddingForm.wedding_date ? format(weddingForm.wedding_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={weddingForm.wedding_date}
                          onSelect={(date: Date | undefined) =>
                            date && setWeddingForm((prev: CreateWeddingInput) => ({ ...prev, wedding_date: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="budget">Total Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="25000"
                      value={weddingForm.total_budget}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setWeddingForm((prev: CreateWeddingInput) => ({ 
                          ...prev, 
                          total_budget: parseFloat(e.target.value) || 0 
                        }))
                      }
                      min="0"
                      step="100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="venue">Venue (Optional)</Label>
                  <Input
                    id="venue"
                    placeholder="Wedding venue location"
                    value={weddingForm.venue || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWeddingForm((prev: CreateWeddingInput) => ({ 
                        ...prev, 
                        venue: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your dream wedding..."
                    value={weddingForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setWeddingForm((prev: CreateWeddingInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-pink-600 hover:bg-pink-700">
                  {isLoading ? 'Creating...' : '✨ Create Wedding Plan'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💕 Wedding Planner</h1>
          {selectedWedding && (
            <div className="bg-white rounded-lg p-4 max-w-2xl mx-auto shadow-sm">
              <h2 className="text-2xl font-semibold text-pink-600 mb-2">{selectedWedding.title}</h2>
              <p className="text-gray-600 mb-2">
                {selectedWedding.bride_name} & {selectedWedding.groom_name}
              </p>
              <p className="text-sm text-gray-500">
                📅 {format(selectedWedding.wedding_date, "PPPP")}
                {selectedWedding.venue && ` • 📍 ${selectedWedding.venue}`}
              </p>
            </div>
          )}
        </div>

        {/* Dashboard Stats */}
        {selectedWedding && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tasks Complete</p>
                    <p className="text-2xl font-bold text-gray-900">{completedTasks}/{tasks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Budget Used</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${spentBudget.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">of ${totalBudget.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Guests Attending</p>
                    <p className="text-2xl font-bold text-gray-900">{attendingGuests}</p>
                    <p className="text-xs text-gray-500">of {guests.length} invited</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CalendarLarge className="h-8 w-8 text-pink-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Days Until Wedding</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(0, Math.ceil((selectedWedding.wedding_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">📋 Tasks</TabsTrigger>
            <TabsTrigger value="budget">💰 Budget</TabsTrigger>
            <TabsTrigger value="guests">👥 Guests</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-title">Task Title</Label>
                      <Input
                        id="task-title"
                        placeholder="Book photographer"
                        value={taskForm.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTaskForm((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select 
                        value={taskForm.priority} 
                        onValueChange={(value: 'low' | 'medium' | 'high') =>
                          setTaskForm((prev: CreateTaskInput) => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Due Date (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !taskForm.due_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {taskForm.due_date ? format(taskForm.due_date, "PPP") : "Select due date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={taskForm.due_date || undefined}
                            onSelect={(date: Date | undefined) =>
                              setTaskForm((prev: CreateTaskInput) => ({ ...prev, due_date: date || null }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="task-category">Category (Optional)</Label>
                      <Input
                        id="task-category"
                        placeholder="Venue, Catering, etc."
                        value={taskForm.category || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTaskForm((prev: CreateTaskInput) => ({ 
                            ...prev, 
                            category: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="task-description">Description (Optional)</Label>
                    <Textarea
                      id="task-description"
                      placeholder="Task details..."
                      value={taskForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setTaskForm((prev: CreateTaskInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                    />
                  </div>

                  <Button type="submit" disabled={isLoading || !selectedWedding}>
                    {isLoading ? 'Adding...' : 'Add Task'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {tasks.map((task: Task) => (
                <Card key={task.id} className={cn(
                  "transition-colors",
                  task.completed && "bg-green-50 border-green-200"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Switch
                          checked={task.completed}
                          onCheckedChange={(checked: boolean) => handleToggleTask(task.id, checked)}
                        />
                        <div className="flex-1">
                          <h3 className={cn(
                            "font-medium",
                            task.completed && "line-through text-gray-500"
                          )}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={
                                task.priority === 'high' ? 'destructive' : 
                                task.priority === 'medium' ? 'default' : 'secondary'
                              }
                            >
                              {task.priority}
                            </Badge>
                            {task.category && (
                              <Badge variant="outline">{task.category}</Badge>
                            )}
                            {task.due_date && (
                              <span className="text-xs text-gray-500">
                                Due: {format(task.due_date, "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Budget Item
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBudgetItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget-category">Category</Label>
                      <Input
                        id="budget-category"
                        placeholder="Venue, Photography, etc."
                        value={budgetForm.category}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBudgetForm((prev: CreateBudgetItemInput) => ({ ...prev, category: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget-item">Item Name</Label>
                      <Input
                        id="budget-item"
                        placeholder="Wedding photographer"
                        value={budgetForm.item_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBudgetForm((prev: CreateBudgetItemInput) => ({ ...prev, item_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="estimated-cost">Estimated Cost ($)</Label>
                      <Input
                        id="estimated-cost"
                        type="number"
                        placeholder="2500"
                        value={budgetForm.estimated_cost}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBudgetForm((prev: CreateBudgetItemInput) => ({ 
                            ...prev, 
                            estimated_cost: parseFloat(e.target.value) || 0 
                          }))
                        }
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="actual-cost">Actual Cost ($) (Optional)</Label>
                      <Input
                        id="actual-cost"
                        type="number"
                        placeholder="2400"
                        value={budgetForm.actual_cost || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBudgetForm((prev: CreateBudgetItemInput) => ({ 
                            ...prev, 
                            actual_cost: parseFloat(e.target.value) || null 
                          }))
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendor">Vendor (Optional)</Label>
                      <Input
                        id="vendor"
                        placeholder="ABC Photography"
                        value={budgetForm.vendor || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBudgetForm((prev: CreateBudgetItemInput) => ({ 
                            ...prev, 
                            vendor: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="paid"
                      checked={budgetForm.paid}
                      onCheckedChange={(checked: boolean) =>
                        setBudgetForm((prev: CreateBudgetItemInput) => ({ ...prev, paid: checked }))
                      }
                    />
                    <Label htmlFor="paid">Already paid</Label>
                  </div>

                  <div>
                    <Label htmlFor="budget-notes">Notes (Optional)</Label>
                    <Textarea
                      id="budget-notes"
                      placeholder="Additional notes..."
                      value={budgetForm.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setBudgetForm((prev: CreateBudgetItemInput) => ({ 
                          ...prev, 
                          notes: e.target.value ||null 
                        }))
                      }
                    />
                  </div>

                  <Button type="submit" disabled={isLoading || !selectedWedding}>
                    {isLoading ? 'Adding...' : 'Add Budget Item'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {budgetItems.map((item: BudgetItem) => (
                <Card key={item.id} className={cn(
                  "transition-colors",
                  item.paid && "bg-green-50 border-green-200"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Switch
                          checked={item.paid}
                          onCheckedChange={(checked: boolean) => handleTogglePaid(item.id, checked)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{item.item_name}</h3>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                          {item.vendor && (
                            <p className="text-sm text-gray-600">Vendor: {item.vendor}</p>
                          )}
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm">
                              Estimated: <strong>${item.estimated_cost.toFixed(2)}</strong>
                            </span>
                            {item.actual_cost && (
                              <span className="text-sm">
                                Actual: <strong>${item.actual_cost.toFixed(2)}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Guests Tab */}
          <TabsContent value="guests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Guest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGuest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guest-name">Guest Name</Label>
                      <Input
                        id="guest-name"
                        placeholder="John Smith"
                        value={guestForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGuestForm((prev: CreateGuestInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest-email">Email (Optional)</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="john@example.com"
                        value={guestForm.email || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGuestForm((prev: CreateGuestInput) => ({ 
                            ...prev, 
                            email: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guest-phone">Phone (Optional)</Label>
                      <Input
                        id="guest-phone"
                        placeholder="+1 (555) 123-4567"
                        value={guestForm.phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGuestForm((prev: CreateGuestInput) => ({ 
                            ...prev, 
                            phone: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="table-number">Table Number (Optional)</Label>
                      <Input
                        id="table-number"
                        type="number"
                        placeholder="5"
                        value={guestForm.table_number || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGuestForm((prev: CreateGuestInput) => ({ 
                            ...prev, 
                            table_number: parseInt(e.target.value) || null 
                          }))
                        }
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guest-address">Address (Optional)</Label>
                    <Textarea
                      id="guest-address"
                      placeholder="123 Main St, City, State 12345"
                      value={guestForm.address || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setGuestForm((prev: CreateGuestInput) => ({ 
                          ...prev, 
                          address: e.target.value || null 
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="dietary-restrictions">Dietary Restrictions (Optional)</Label>
                    <Input
                      id="dietary-restrictions"
                      placeholder="Vegetarian, Gluten-free, etc."
                      value={guestForm.dietary_restrictions || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setGuestForm((prev: CreateGuestInput) => ({ 
                          ...prev, 
                          dietary_restrictions: e.target.value || null 
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="plus-one"
                      checked={guestForm.plus_one}
                      onCheckedChange={(checked: boolean) =>
                        setGuestForm((prev: CreateGuestInput) => ({ ...prev, plus_one: checked }))
                      }
                    />
                    <Label htmlFor="plus-one">Plus One</Label>
                  </div>

                  <Button type="submit" disabled={isLoading || !selectedWedding}>
                    {isLoading ? 'Adding...' : 'Add Guest'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {guests.map((guest: Guest) => (
                <Card key={guest.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{guest.name}</h3>
                          {guest.plus_one && <Badge variant="secondary">+1</Badge>}
                          {guest.table_number && (
                            <Badge variant="outline">Table {guest.table_number}</Badge>
                          )}
                        </div>
                        
                        {guest.email && (
                          <p className="text-sm text-gray-600">📧 {guest.email}</p>
                        )}
                        {guest.phone && (
                          <p className="text-sm text-gray-600">📞 {guest.phone}</p>
                        )}
                        {guest.dietary_restrictions && (
                          <p className="text-sm text-gray-600">🍽️ {guest.dietary_restrictions}</p>
                        )}
                        {guest.gift_description && (
                          <div className="flex items-center gap-2 mt-2">
                            <Gift className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              {guest.gift_description}
                              {guest.gift_value && ` ($${guest.gift_value})`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Select 
                          value={guest.rsvp_status} 
                          onValueChange={(value: 'pending' | 'attending' | 'not_attending') =>
                            handleUpdateRsvp(guest.id, value)
                          }
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="attending">Attending</SelectItem>
                            <SelectItem value="not_attending">Not Attending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Note about stub implementation */}
        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This application is currently using placeholder data from the backend API. 
              The handlers return stub data for demonstration purposes. In a production environment, 
              this would connect to a real database to persist your wedding planning data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
