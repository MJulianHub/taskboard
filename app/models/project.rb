class Project < ApplicationRecord
  has_many :project_memberships
  has_many :users, through: :project_memberships
  has_many :tasks
  belongs_to :owner, class_name: "User"

  def tasks_count
    tasks.count
  end
end
