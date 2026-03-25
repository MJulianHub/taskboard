json.extract! project, :id, :name, :description, :created_at
json.users project.users, :id, :email, :first_name, :last_name
