json.extract! task, :id, :title, :status, :due_date, :created_at
json.user do
  json.id task.user.id
  json.full_name task.user.full_name
end
