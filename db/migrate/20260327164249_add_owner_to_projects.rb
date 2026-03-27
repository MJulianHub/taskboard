class AddOwnerToProjects < ActiveRecord::Migration[8.1]
  def change
    add_reference :projects, :owner, foreign_key: { to_table: :users }

    Project.find_each do |project|
      membership = project.project_memberships.first
      project.update!(owner_id: membership.user_id) if membership
    end

    change_column_null :projects, :owner_id, false
  end
end
