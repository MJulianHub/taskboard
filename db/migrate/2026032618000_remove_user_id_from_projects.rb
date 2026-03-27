class RemoveUserIdFromProjects < ActiveRecord::Migration[8.1]
  def change
    remove_column :projects, :user_id, :integer
  end
end
