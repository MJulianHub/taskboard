json.extract! @project, :id, :name, :description, :created_at
json.tasks_count @project.tasks_count
json.users @project.users, :id, :email, :first_name, :last_name
json.owner @project.owner, :id, :first_name, :last_name
