# namespace :tasks do
#   desc "Mark overdue tasks based on due_date (DISABLED - use Sidekiq job)"
#   task mark_overdue: :environment do
#     puts "This task is disabled. Use Sidekiq to run CheckOverdueTasksJob automatically."
#     puts "For manual execution, run: rails runner 'CheckOverdueTasksJob.perform_now'"
#   end
# end
