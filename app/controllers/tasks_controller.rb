class TasksController < ApplicationController
    before_action :authenticate_user!
    before_action :set_project
    before_action :authorize_user!
    before_action :set_task, only: [ :update ]

    def update
        if @task.update(task_params)
          render json: @task
        else
          render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def index
        tasks = @project.tasks.includes(:user)
        render json: tasks.as_json(
          include: { user: { only: [ :id, :email ], methods: [ :full_name ] } },
          only: [ :id, :title, :status, :due_date ]
        )
      end

    def create
        task = @project.tasks.new(task_params)
        task.user = current_user

        if task.save
        render json: task, status: :created
        else
        render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
        end
    end

    private

    def set_project
        @project = Project.find(params[:project_id])
    end

    def authorize_user!
        unless @project.users.include?(current_user)
        render json: { error: "No autorizado" }, status: :forbidden
        end
    end
    def set_task
        @task = @project.tasks.find(params[:id])
      end

    def task_params
        params.require(:task).permit(:title, :status, :due_date)
    end
end
